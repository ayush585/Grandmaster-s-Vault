import type { EngineEval, MoveAnalysis, MoveClassification, AnalysisProgress } from '@/types';
import { Chess } from 'chess.js';

const STOCKFISH_LOCAL = '/stockfish/stockfish.js';
const STOCKFISH_CDN = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';

let worker: Worker | null = null;
let ready = false;
let messageHandlers: Array<(msg: string) => void> = [];
let analysisQueue: Promise<void> = Promise.resolve();

export type AnalysisDepth = 12 | 16 | 18 | 20;
export const DEPTH_LABELS: Record<AnalysisDepth, string> = {
  12: 'Quick',
  16: 'Standard',
  18: 'Standard+',
  20: 'Deep',
};

export async function initEngine(): Promise<void> {
  if (worker && ready) return;

  if (worker) {
    worker.terminate();
    worker = null;
    ready = false;
    messageHandlers = [];
  }

  // Try local first, then CDN fallback
  let js: string | null = null;
  try {
    const response = await fetch(STOCKFISH_LOCAL);
    if (response.ok) {
      js = await response.text();
    }
  } catch {
    // local fetch failed, try CDN
  }

  if (!js) {
    try {
      const response = await fetch(STOCKFISH_CDN);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      js = await response.text();
    } catch (err) {
      throw new Error(
        `Could not load Stockfish engine. Ensure the app was built with stockfish.js bundled, or check internet connection. (${err})`
      );
    }
  }

  const blob = new Blob([js], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  worker = new Worker(url);
  URL.revokeObjectURL(url);

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Stockfish engine timed out during initialization'));
    }, 15000);

    const cleanup = () => {
      clearTimeout(timeout);
    };

    worker!.onerror = (e) => {
      cleanup();
      reject(new Error(`Stockfish worker error: ${e.message}`));
    };

    worker!.onmessage = (e) => {
      const msg = String(e.data);
      if (msg === 'uciok') {
        sendUCI('setoption name Skill Level value 20');
        sendUCI('isready');
      } else if (msg === 'readyok' && !ready) {
        ready = true;
        cleanup();
        // Set up permanent message handler for dispatching
        worker!.onmessage = (ev) => {
          const m = String(ev.data);
          // Copy array to avoid mutation during iteration
          const handlers = [...messageHandlers];
          handlers.forEach((h) => h(m));
        };
        // Set up crash recovery
        worker!.onerror = handleWorkerCrash;
        resolve();
      }
      // During init, also dispatch to any registered handlers
      messageHandlers.forEach((h) => h(msg));
    };

    sendUCI('uci');
  });
}

function handleWorkerCrash(e: ErrorEvent) {
  console.error('[Engine] Worker crashed:', e.message);
  worker = null;
  ready = false;
  analyzing = false;
  messageHandlers = [];
}

function sendUCI(cmd: string) {
  worker?.postMessage(cmd);
}

let currentAnalysis: Promise<EngineEval> | null = null;

export function analyzePosition(fen: string, depth = 18): Promise<EngineEval> {
  if (currentAnalysis) {
    return currentAnalysis;
  }

  currentAnalysis = doAnalyzePosition(fen, depth);
  const result = currentAnalysis;
  
  result.finally(() => {
    currentAnalysis = null;
  });
  
  return result;
}

async function doAnalyzePosition(fen: string, depth = 18): Promise<EngineEval> {
  return new Promise((resolve) => {
    const result: EngineEval = { eval: 0, mate: null, bestMove: '', pv: '', depth: 0 };
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      const idx = messageHandlers.indexOf(handler);
      if (idx >= 0) messageHandlers.splice(idx, 1);
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(result);
    }, 30000);

    const handler = (msg: string) => {
      if (cleanedUp) return;

      if (msg.startsWith('info depth')) {
        const depthMatch = msg.match(/depth (\d+)/);
        const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
        const pvMatch = msg.match(/ pv (.+)/);

        if (depthMatch) result.depth = parseInt(depthMatch[1]);
        if (scoreMatch) {
          if (scoreMatch[1] === 'cp') {
            result.eval = parseInt(scoreMatch[2]) / 100;
            result.mate = null;
          } else {
            result.mate = parseInt(scoreMatch[2]);
            result.eval = result.mate > 0 ? 999 : -999;
          }
        }
        if (pvMatch) result.pv = pvMatch[1];
      }

      if (msg.startsWith('bestmove')) {
        clearTimeout(timeout);
        result.bestMove = msg.split(' ')[1] || '';
        cleanup();
        resolve(result);
      }
    };

    messageHandlers.push(handler);
    sendUCI('position fen ' + fen);
    sendUCI('go depth ' + depth);
  });
}

function uciToSan(fen: string, uciMove: string): string {
  if (!uciMove || uciMove.length < 4) return uciMove;
  try {
    const chess = new Chess(fen);
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
    const move = chess.move({ from, to, promotion });
    return move ? move.san : uciMove;
  } catch {
    return uciMove;
  }
}

export function classifyMove(cpLoss: number): MoveClassification {
  if (cpLoss <= 0) return 'best';
  if (cpLoss <= 25) return 'good';
  if (cpLoss <= 50) return 'inaccuracy';
  if (cpLoss <= 150) return 'mistake';
  return 'blunder';
}

function evalFromWhitePerspective(
  evalScore: number,
  mate: number | null,
  isWhiteToMove: boolean
): number {
  if (mate !== null) {
    const mateEval = mate > 0 ? 999 : -999;
    return isWhiteToMove ? mateEval : -mateEval;
  }
  return isWhiteToMove ? evalScore : -evalScore;
}

export let analyzing = false;

export async function analyzeGame(
  fens: string[],
  moves: string[],
  depth: AnalysisDepth = 16,
  onProgress?: (progress: AnalysisProgress) => void,
  signal?: { cancelled: boolean },
  onPartialResults?: (results: MoveAnalysis[]) => void
): Promise<MoveAnalysis[]> {
  // Queue analysis to prevent interleaving
  const result = new Promise<MoveAnalysis[]>((resolve, reject) => {
    analysisQueue = analysisQueue.then(async () => {
      try {
        const r = await _analyzeGameInternal(fens, moves, depth, onProgress, signal, onPartialResults);
        resolve(r);
      } catch (e) {
        reject(e);
      }
    });
  });
  return result;
}

async function _analyzeGameInternal(
  fens: string[],
  moves: string[],
  depth: AnalysisDepth,
  onProgress?: (progress: AnalysisProgress) => void,
  signal?: { cancelled: boolean },
  onPartialResults?: (results: MoveAnalysis[]) => void
): Promise<MoveAnalysis[]> {
  if (!ready) {
    // Try to recover if worker crashed
    if (!worker) {
      await initEngine();
    } else {
      await initEngine();
    }
  }
  analyzing = true;

  const results: MoveAnalysis[] = [];
  const positionEvals: EngineEval[] = [];
  const whiteEvals: number[] = [];

  // Pass 1: Analyze every position
  for (let i = 0; i < fens.length; i++) {
    if (signal?.cancelled) break;

    // Check if worker is still alive
    if (!worker) {
      throw new Error('Engine worker crashed during analysis. Please try again.');
    }

    sendUCI('stop');
    await new Promise((r) => setTimeout(r, 20));

    const posEval = await analyzePosition(fens[i], depth);
    positionEvals.push(posEval);

    const isWhiteToMove = i % 2 === 0;
    const whiteEval = evalFromWhitePerspective(posEval.eval, posEval.mate, isWhiteToMove);
    whiteEvals.push(whiteEval);

    onProgress?.({
      current: i + 1,
      total: fens.length,
      currentEval: posEval,
    });

    // Build partial results as we go (for auto-save every 10 moves)
    if (i > 0) {
      const moveIndex = i - 1;
      const isWhiteMove = moveIndex % 2 === 0;
      const prevWE = whiteEvals[i - 1];
      const currWE = whiteEvals[i];
      const cpLoss = isWhiteMove
        ? (prevWE - currWE) * 100
        : (currWE - prevWE) * 100;
      const classification = classifyMove(Math.max(0, cpLoss));
      const beforeEval = positionEvals[i - 1];
      const bestMoveSan = uciToSan(fens[i - 1], beforeEval.bestMove || '');

      results.push({
        ply: i,
        san: moves[moveIndex] || '',
        fen: fens[i],
        eval: currWE,
        mate: positionEvals[i].mate,
        bestMove: beforeEval.bestMove,
        bestMoveSan,
        pv: beforeEval.pv,
        depth: positionEvals[i].depth,
        classification,
        cpLoss: Math.max(0, cpLoss),
        isWhiteMove,
      });

      // Auto-save partial results every 10 moves
      if (results.length % 10 === 0 && onPartialResults) {
        onPartialResults([...results]);
      }
    }
  }

  analyzing = false;
  return results;
}

export function computeAccuracy(analysis: MoveAnalysis[]): { white: number; black: number } {
  const whiteMoves = analysis.filter((m) => m.isWhiteMove);
  const blackMoves = analysis.filter((m) => !m.isWhiteMove);

  function avgAccuracy(moves: MoveAnalysis[]): number {
    if (moves.length === 0) return 100;
    const accuracies = moves.map((m) => {
      const cpLoss = m.cpLoss || 0;
      return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * cpLoss) - 3.1668));
    });
    return Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
  }

  return {
    white: avgAccuracy(whiteMoves),
    black: avgAccuracy(blackMoves),
  };
}

export function stopEngine() {
  analyzing = false;
  sendUCI('stop');
  // Clean up all pending message handlers
  messageHandlers = [];
}

export function destroyEngine() {
  analyzing = false;
  messageHandlers = [];
  if (worker) {
    sendUCI('quit');
    worker.terminate();
    worker = null;
    ready = false;
  }
}

export function isEngineReady(): boolean {
  return !!worker && ready;
}
