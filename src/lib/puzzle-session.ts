import { Chess } from 'chess.js';

export interface StrictPuzzleStepResult {
  ok: boolean;
  status: 'active' | 'solved' | 'failed';
  nextIndex: number;
  expectedMove?: string;
  autoPlayedMove?: string;
}

export function moveToUci(from: string, to: string, promotion?: string): string {
  return `${from}${to}${promotion || ''}`;
}

export function applyUciMove(chess: Chess, uci: string): boolean {
  if (!uci || uci.length < 4) return false;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move = chess.move({ from, to, promotion });
  return !!move;
}

export function playStrictPuzzleMove(
  chess: Chess,
  solution: string[],
  solutionIndex: number,
  userUci: string
): StrictPuzzleStepResult {
  const expectedMove = solution[solutionIndex];
  if (!expectedMove) {
    return {
      ok: false,
      status: 'failed',
      nextIndex: solutionIndex,
      expectedMove: undefined,
    };
  }

  if (userUci !== expectedMove) {
    return {
      ok: false,
      status: 'failed',
      nextIndex: solutionIndex,
      expectedMove,
    };
  }

  const played = applyUciMove(chess, expectedMove);
  if (!played) {
    return {
      ok: false,
      status: 'failed',
      nextIndex: solutionIndex,
      expectedMove,
    };
  }

  let nextIndex = solutionIndex + 1;
  if (nextIndex >= solution.length) {
    return {
      ok: true,
      status: 'solved',
      nextIndex,
    };
  }

  const autoPlayedMove = solution[nextIndex];
  if (!autoPlayedMove || !applyUciMove(chess, autoPlayedMove)) {
    return {
      ok: false,
      status: 'failed',
      nextIndex,
      expectedMove: autoPlayedMove,
    };
  }

  nextIndex += 1;
  if (nextIndex >= solution.length) {
    return {
      ok: true,
      status: 'solved',
      nextIndex,
      autoPlayedMove,
    };
  }

  return {
    ok: true,
    status: 'active',
    nextIndex,
    autoPlayedMove,
  };
}
