import { describe, expect, it } from 'vitest';
import { initialScoutState, scoutReducer } from '@/contexts/ScoutContext';

describe('scoutReducer', () => {
  it('switches tabs', () => {
    const next = scoutReducer(initialScoutState, { type: 'SET_TAB', tab: 'puzzles' });
    expect(next.activeTab).toBe('puzzles');
  });

  it('stores preferred puzzle themes', () => {
    const next = scoutReducer(initialScoutState, {
      type: 'SET_PREFERRED_PUZZLE_THEMES',
      themes: ['fork', 'pin'],
    });
    expect(next.preferredPuzzleThemes).toEqual(['fork', 'pin']);
  });

  it('tracks puzzle attempts and advances puzzles', () => {
    const stateWithSession = scoutReducer(initialScoutState, {
      type: 'SET_PUZZLE_SESSION',
      session: {
        theme: 'fork',
        themeLabel: 'Fork',
        currentIndex: 0,
        active: true,
        attempts: [],
        puzzles: [
          { id: 'p1', fen: '8/8/8/8/8/8/8/8 w - - 0 1', moves: ['a2a3'], rating: 1200, themes: ['fork'], url: '#' },
        ],
      },
    });

    const withAttempt = scoutReducer(stateWithSession, {
      type: 'ADD_PUZZLE_ATTEMPT',
      attempt: { puzzleId: 'p1', result: 'skipped', theme: 'fork' },
    });
    expect(withAttempt.puzzleSession?.attempts).toHaveLength(1);

    const nextPuzzle = scoutReducer(withAttempt, { type: 'NEXT_PUZZLE' });
    expect(nextPuzzle.puzzleSession?.currentIndex).toBe(1);
    expect(nextPuzzle.puzzleSession?.active).toBe(false);
  });

  it('resets state', () => {
    const mutated = scoutReducer(initialScoutState, { type: 'SET_TAB', tab: 'self' });
    const reset = scoutReducer(mutated, { type: 'RESET' });
    expect(reset).toEqual(initialScoutState);
  });
});
