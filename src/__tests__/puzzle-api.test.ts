import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzleFetchError, fetchPuzzlesForTheme, getAvailableThemes } from '@/lib/puzzle-api';

function mockPuzzlePayload(id: string) {
  return {
    puzzle: {
      id,
      rating: 1500,
      themes: ['fork'],
      solution: ['e2e4', 'e7e5'],
      initialPly: 2,
    },
    game: {
      pgn: '1. e4 e5 2. Nf3 Nc6',
    },
  };
}

describe('puzzle-api', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns playable puzzles for a valid theme', async () => {
    const theme = getAvailableThemes()[0];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const id = String(input).split('/').pop() || 'x';
      return new Response(JSON.stringify(mockPuzzlePayload(id)), { status: 200 });
    });
    global.fetch = fetchMock as typeof fetch;

    const puzzles = await fetchPuzzlesForTheme(theme, 1, { minPlayable: 1, candidateMultiplier: 1 });
    expect(puzzles).toHaveLength(1);
    expect(puzzles[0].fen).toContain('/');
  });

  it('skips invalid puzzle IDs and continues with next candidates', async () => {
    const theme = getAvailableThemes()[0];
    let calls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      calls += 1;
      if (calls === 1) {
        return new Response('not found', { status: 404 });
      }
      const id = String(input).split('/').pop() || 'x';
      return new Response(JSON.stringify(mockPuzzlePayload(id)), { status: 200 });
    });
    global.fetch = fetchMock as typeof fetch;

    const puzzles = await fetchPuzzlesForTheme(theme, 1, { minPlayable: 1 });
    expect(puzzles).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws THEME_UNAVAILABLE when minimum playable puzzles are not reached', async () => {
    const theme = getAvailableThemes()[0];
    const fetchMock = vi.fn(async () => new Response('not found', { status: 404 }));
    global.fetch = fetchMock as typeof fetch;

    await expect(fetchPuzzlesForTheme(theme, 3, { minPlayable: 3, candidateMultiplier: 1 })).rejects.toMatchObject({
      code: 'THEME_UNAVAILABLE',
    });
  });

  it('throws NETWORK_ERROR when API is unreachable and no puzzles are playable', async () => {
    const theme = getAvailableThemes()[0];
    const fetchMock = vi.fn(async () => {
      throw new Error('network down');
    });
    global.fetch = fetchMock as typeof fetch;

    await expect(fetchPuzzlesForTheme(theme, 2, { minPlayable: 2, candidateMultiplier: 1 })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('throws typed theme-unavailable error for unknown themes', async () => {
    await expect(fetchPuzzlesForTheme('unknown-theme', 1)).rejects.toBeInstanceOf(PuzzleFetchError);
    await expect(fetchPuzzlesForTheme('unknown-theme', 1)).rejects.toMatchObject({
      code: 'THEME_UNAVAILABLE',
    });
  });
});
