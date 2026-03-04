import type { GamePhase } from '@/types';
import { Chess } from 'chess.js';

// Piece values (non-pawn, non-king material)
const PIECE_VALUES: Record<string, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
};

/**
 * Count total non-pawn, non-king material on the board.
 */
export function countMaterial(fen: string): number {
  const board = fen.split(' ')[0];
  let total = 0;
  for (const ch of board) {
    const lower = ch.toLowerCase();
    if (PIECE_VALUES[lower]) {
      total += PIECE_VALUES[lower];
    }
  }
  return total;
}

/**
 * Detect the game phase for a given FEN position and ply number.
 *
 * - Opening: ply < 20 AND material >= 28
 * - Endgame: total non-pawn material <= 13
 * - Middlegame: everything else
 */
export function detectPhase(fen: string, ply: number): GamePhase {
  const material = countMaterial(fen);

  if (material <= 13) return 'endgame';
  if (ply < 20 && material >= 28) return 'opening';
  return 'middlegame';
}

/**
 * Classify each move in a game into its phase.
 * Returns an array of phases, one per move (not per position).
 */
export function classifyGamePhases(fens: string[]): GamePhase[] {
  const phases: GamePhase[] = [];
  // fens[0] is the starting position, fens[i] is position after move i
  for (let i = 1; i < fens.length; i++) {
    phases.push(detectPhase(fens[i], i));
  }
  return phases;
}
