import { describe, it, expect } from 'vitest';
import { computeAccuracy, classifyMove } from '../lib/engine';

describe('classifyMove', () => {
  it('classifies best moves (cpLoss <= 0)', () => {
    expect(classifyMove(0)).toBe('best');
    expect(classifyMove(-5)).toBe('best');
  });

  it('classifies good moves (cpLoss <= 25)', () => {
    expect(classifyMove(10)).toBe('good');
    expect(classifyMove(25)).toBe('good');
  });

  it('classifies inaccuracies (cpLoss <= 50)', () => {
    expect(classifyMove(30)).toBe('inaccuracy');
    expect(classifyMove(50)).toBe('inaccuracy');
  });

  it('classifies mistakes (cpLoss <= 150)', () => {
    expect(classifyMove(75)).toBe('mistake');
    expect(classifyMove(150)).toBe('mistake');
  });

  it('classifies blunders (cpLoss > 150)', () => {
    expect(classifyMove(151)).toBe('blunder');
    expect(classifyMove(500)).toBe('blunder');
  });
});

describe('computeAccuracy', () => {
  const mockAnalysis = (cpLosses: number[], isWhite: boolean[]) => {
    return cpLosses.map((cpLoss, i) => ({
      ply: i + 1,
      san: 'e4',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      eval: 0,
      mate: null,
      bestMove: 'e5',
      bestMoveSan: 'e5',
      pv: 'e5',
      depth: 18,
      classification: classifyMove(cpLoss),
      cpLoss,
      isWhiteMove: isWhite[i],
    }));
  };

  it('returns 100 for empty game', () => {
    const result = computeAccuracy([]);
    expect(result.white).toBe(100);
    expect(result.black).toBe(100);
  });

  it('calculates white accuracy correctly', () => {
    // White makes a blunder (cpLoss > 150), black plays perfectly (cpLoss = 0)
    const analysis = mockAnalysis([200, 0], [true, false]);
    const result = computeAccuracy(analysis);
    expect(result.white).toBeLessThan(100);
    expect(result.black).toBe(100);
  });

  it('calculates black accuracy correctly', () => {
    // White plays perfectly, black makes a blunder
    const analysis = mockAnalysis([0, 200], [true, false]);
    const result = computeAccuracy(analysis);
    expect(result.white).toBe(100);
    expect(result.black).toBeLessThan(100);
  });

  it('calculates mixed accuracy', () => {
    // White: good (10), black: good (15), white: mistake (100)
    const analysis = mockAnalysis([10, 15, 100], [true, false, true]);
    const result = computeAccuracy(analysis);
    expect(result.white).toBeLessThan(100);
    expect(result.black).toBeLessThan(100);
    expect(result.white).not.toBe(result.black);
  });
});
