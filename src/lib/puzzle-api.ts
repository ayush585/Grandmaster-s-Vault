import { Chess } from 'chess.js';
import type { LichessPuzzle, PuzzleSession } from '@/types';
import puzzleIdsData from '@/data/puzzle-ids.json';

const puzzleIds = puzzleIdsData as Record<string, string[]>;

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

async function fetchPuzzle(id: string): Promise<LichessPuzzle | null> {
  try {
    const res = await fetch(`https://lichess.org/api/puzzle/${id}`, {
      headers: { Accept: 'application/json' },
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
  } catch {
    return null;
  }
}

export async function fetchPuzzlesForTheme(theme: string, count = 10): Promise<LichessPuzzle[]> {
  const ids = puzzleIds[theme];
  if (!ids || ids.length === 0) {
    return [];
  }

  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.max(count * 2, count));

  const puzzles: LichessPuzzle[] = [];
  for (const id of selected) {
    const puzzle = await fetchPuzzle(id);
    if (puzzle) {
      puzzles.push(puzzle);
    }

    await new Promise((r) => setTimeout(r, 250));
    if (puzzles.length >= count) break;
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
