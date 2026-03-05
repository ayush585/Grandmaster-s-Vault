import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGames } from '@/lib/chess-api';

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError');
}

describe('chess-api cancellation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('aborts in-flight fetch requests via AbortController', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal?.aborted) {
          reject(abortError());
          return;
        }
        signal?.addEventListener('abort', () => reject(abortError()), { once: true });
      });
    });
    global.fetch = fetchMock as typeof fetch;

    const request = fetchGames('chesscom', 'testuser', 10, controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('halts retry/backoff flow after cancel during a 429 backoff', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async () => new Response('rate limited', { status: 429, statusText: 'Too Many Requests' }));
    global.fetch = fetchMock as typeof fetch;

    const request = fetchGames('chesscom', 'testuser', 10, controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
