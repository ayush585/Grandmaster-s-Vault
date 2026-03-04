import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { derivePuzzleStartFenFromPgn } from '@/lib/puzzle-api';
import { playStrictPuzzleMove } from '@/lib/puzzle-session';

describe('derivePuzzleStartFenFromPgn', () => {
  it('derives FEN after initial plies', () => {
    const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
    const fen = derivePuzzleStartFenFromPgn(pgn, 2);

    expect(fen).toBeTruthy();
    expect(fen).toContain('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq');
  });
});

describe('playStrictPuzzleMove', () => {
  it('advances through strict line with auto opponent reply and solves', () => {
    const chess = new Chess();
    const solution = ['e2e4', 'e7e5', 'g1f3', 'b8c6'];

    const first = playStrictPuzzleMove(chess, solution, 0, 'e2e4');
    expect(first.ok).toBe(true);
    expect(first.status).toBe('active');
    expect(first.nextIndex).toBe(2);

    const second = playStrictPuzzleMove(chess, solution, first.nextIndex, 'g1f3');
    expect(second.ok).toBe(true);
    expect(second.status).toBe('solved');
    expect(second.nextIndex).toBe(4);
  });

  it('fails on wrong move and returns expected move', () => {
    const chess = new Chess();
    const solution = ['e2e4', 'e7e5'];

    const result = playStrictPuzzleMove(chess, solution, 0, 'd2d4');
    expect(result.ok).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.expectedMove).toBe('e2e4');
    expect(result.nextIndex).toBe(0);
  });
});
