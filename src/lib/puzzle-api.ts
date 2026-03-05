import { Chess } from 'chess.js';
import type { LichessPuzzle, PuzzleFetchErrorCode, PuzzleIndexSchema, PuzzleSession } from '@/types';
import puzzleIdsData from '@/data/puzzle-ids.json';

const puzzleIndex = puzzleIdsData as PuzzleIndexSchema;

function normalizePuzzleIndex(data: PuzzleIndexSchema): Record<string, string[]> {
  const themes = data?.themes || {};
  const normalized: Record<string, string[]> = {};

  Object.entries(themes).forEach(([theme, ids]) => {
    if (!Array.isArray(ids)) return;
    normalized[theme] = ids.filter((id): id is string => /^[A-Za-z0-9]{5}$/.test(id));
  });

  return normalized;
}

const puzzleIds = normalizePuzzleIndex(puzzleIndex);

export const PUZZLE_THEME_LABELS: Record<string, string> = {
  fork: 'Fork',
  pin: 'Pin',
  endgame: 'Endgame',
  rookEndgame: 'Rook Endgame',
  pawnEndgame: 'Pawn Endgame',
  bishopEndgame: 'Bishop Endgame',
  opening: 'Opening',
  middlegame: 'Middlegame',
  hangingPiece: 'Hanging Piece',
  trappedPiece: 'Trapped Piece',
  attackingF2F7: 'Attacking f2/f7',
  deflection: 'Deflection',
  doubleCheck: 'Double Check',
  skewer: 'Skewer',
  xRayAttack: 'X-Ray Attack',
  backRankMate: 'Back Rank Mate',
  mateIn1: 'Mate in 1',
  mateIn2: 'Mate in 2',
  short: 'Short Puzzle',
  oneMove: 'One Move',
};

interface LichessPuzzleApiResponse {
  puzzle?: {
    id?: string;
    rating?: number;
    themes?: string[];
    solution?: string[];
    initialPly?: number;
  };
  game?: {
    pgn?: string;
    initialPly?: number;
    fen?: string;
  };
}

export class PuzzleFetchError extends Error {
  code: PuzzleFetchErrorCode;
  theme: string;
  requested: number;
  playable: number;

  constructor(
    code: PuzzleFetchErrorCode,
    message: string,
    theme: string,
    requested: number,
    playable: number
  ) {
    super(message);
    this.name = 'PuzzleFetchError';
    this.code = code;
    this.theme = theme;
    this.requested = requested;
    this.playable = playable;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : !!(error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError');
}

export function derivePuzzleStartFenFromPgn(pgn: string, initialPly: number): string | null {
  try {
    const parsed = new Chess();
    parsed.loadPgn(pgn);

    const history = parsed.history();
    const replay = new Chess();
    const limit = Math.max(0, Math.min(initialPly, history.length));

    for (let i = 0; i < limit; i++) {
      replay.move(history[i]);
    }

    return replay.fen();
  } catch {
    return null;
  }
}

async function fetchPuzzle(id: string, abortSignal?: AbortSignal): Promise<LichessPuzzle | null> {
  try {
    const res = await fetch(`https://lichess.org/api/puzzle/${id}`, {
      headers: { Accept: 'application/json' },
      signal: abortSignal,
    });
    if (!res.ok) return null;

    const data = (await res.json()) as LichessPuzzleApiResponse;
    const puzzle = data.puzzle;
    const game = data.game;

    if (!puzzle || !game || !puzzle.id || !Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
      return null;
    }

    const initialPly = Number(puzzle.initialPly ?? game.initialPly ?? 0);
    const fen = game.fen || (game.pgn ? derivePuzzleStartFenFromPgn(game.pgn, initialPly) : null);

    if (!fen) {
      return null;
    }

    return {
      id: puzzle.id,
      fen,
      moves: puzzle.solution,
      rating: puzzle.rating || 1500,
      themes: puzzle.themes || [],
      url: `https://lichess.org/training/${puzzle.id}`,
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw error;
  }
}

interface FetchPuzzlesOptions {
  abortSignal?: AbortSignal;
  minPlayable?: number;
  candidateMultiplier?: number;
}

export async function fetchPuzzlesForTheme(
  theme: string,
  count = 10,
  options: FetchPuzzlesOptions = {}
): Promise<LichessPuzzle[]> {
  const ids = puzzleIds[theme];
  if (!ids || ids.length === 0) {
    throw new PuzzleFetchError(
      'THEME_UNAVAILABLE',
      'No puzzle IDs are available for this theme yet.',
      theme,
      count,
      0
    );
  }

  const minPlayable = Math.max(1, options.minPlayable ?? count);
  const candidateMultiplier = Math.max(1, options.candidateMultiplier ?? 5);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.max(count * candidateMultiplier, count));

  const puzzles: LichessPuzzle[] = [];
  let networkFailureCount = 0;

  for (const id of selected) {
    if (options.abortSignal?.aborted) {
      throw new PuzzleFetchError('CANCELLED', 'Puzzle loading was cancelled.', theme, count, puzzles.length);
    }

    try {
      const puzzle = await fetchPuzzle(id, options.abortSignal);
      if (puzzle) {
        puzzles.push(puzzle);
      }
    } catch (error) {
      if (isAbortError(error)) {
        throw new PuzzleFetchError('CANCELLED', 'Puzzle loading was cancelled.', theme, count, puzzles.length);
      }
      networkFailureCount++;
    }

    await new Promise((r) => setTimeout(r, 250));
    if (puzzles.length >= count) break;
  }

  if (puzzles.length < minPlayable) {
    const code: PuzzleFetchErrorCode = puzzles.length === 0 && networkFailureCount > 0
      ? 'NETWORK_ERROR'
      : 'THEME_UNAVAILABLE';

    const message = code === 'NETWORK_ERROR'
      ? 'Could not reach Lichess puzzle API. Please retry.'
      : `Theme "${theme}" is currently unavailable. Found ${puzzles.length}/${minPlayable} playable puzzles.`;

    throw new PuzzleFetchError(code, message, theme, count, puzzles.length);
  }

  return puzzles.slice(0, count);
}

export function createPuzzleSession(theme: string, puzzles: LichessPuzzle[]): PuzzleSession {
  return {
    theme,
    themeLabel: PUZZLE_THEME_LABELS[theme] || theme,
    puzzles,
    currentIndex: 0,
    attempts: [],
    active: true,
  };
}

export function getAvailableThemes(): string[] {
  return Object.keys(puzzleIds);
}
