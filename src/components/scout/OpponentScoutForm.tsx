'use client';

import { useState, useRef, useCallback } from 'react';
import { useScout } from '@/contexts/ScoutContext';
import type { ScoutWarningSummary } from '@/types';
import { fetchGames } from '@/lib/chess-api';
import { batchAnalyzeGames } from '@/lib/batch-analyzer';
import { generateWeaknessReport } from '@/lib/weakness-analyzer';
import { cacheGames, getCachedGames, saveReport } from '@/lib/scouting-storage';

const GAME_COUNTS = [10, 25, 50] as const;

function buildWarningSummary(
  fetched: number,
  analyzed: number,
  reused: number,
  cancelled = false
): ScoutWarningSummary | null {
  const skipped = Math.max(0, fetched - analyzed);
  if (!cancelled && skipped <= 0) return null;

  const message = cancelled
    ? `Run cancelled. Analyzed ${analyzed}/${fetched} games so far.`
    : `Partial analysis complete: ${analyzed}/${fetched} games analyzed, ${skipped} skipped.`;

  return {
    fetched,
    analyzed,
    skipped,
    reused,
    message,
  };
}

export default function OpponentScoutForm() {
  const { state, dispatch } = useScout();
  const [platform, setPlatform] = useState<'chesscom' | 'lichess'>('chesscom');
  const [username, setUsername] = useState('');
  const [gameCount, setGameCount] = useState<number>(10);
  const [error, setError] = useState('');
  const cancelRef = useRef({ cancelled: false });

  const handleScout = useCallback(async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setError('');
    cancelRef.current = { cancelled: false };
    dispatch({ type: 'SET_FETCHING', isFetching: true });
    dispatch({ type: 'SET_OPPONENT_WARNING', warning: null });
    dispatch({ type: 'SET_BATCH_PROGRESS', progress: {
      currentGame: 0,
      totalGames: 0,
      currentGameMoveProgress: 0,
      phase: 'fetching',
      message: `Fetching games for ${username}...`,
    } });

    try {
      let games = await getCachedGames(platform, username);

      if (!games || games.length === 0) {
        games = await fetchGames(platform, username, gameCount, cancelRef.current, (msg) => {
          dispatch({
            type: 'SET_BATCH_PROGRESS',
            progress: {
              currentGame: 0,
              totalGames: gameCount,
              currentGameMoveProgress: 0,
              phase: 'fetching',
              message: msg,
            },
          });
        });

        if (games.length > 0) {
          await cacheGames(platform, username, games);
        }
      } else {
        games = games.slice(0, gameCount);
      }

      if (cancelRef.current.cancelled) {
        const warning = buildWarningSummary(games.length, 0, 0, true);
        dispatch({ type: 'SET_OPPONENT_WARNING', warning });
        return;
      }

      if (games.length === 0) {
        setError(`No games found for "${username}" on ${platform === 'chesscom' ? 'Chess.com' : 'Lichess'}`);
        dispatch({ type: 'SET_FETCHING', isFetching: false });
        dispatch({ type: 'SET_BATCH_PROGRESS', progress: null });
        return;
      }

      dispatch({ type: 'SET_FETCHED_GAMES', games });
      dispatch({ type: 'SET_FETCHING', isFetching: false });
      dispatch({ type: 'SET_ANALYZING_BATCH', isAnalyzing: true });

      const { games: analyzedGames, summary } = await batchAnalyzeGames(
        games,
        (progress) => dispatch({ type: 'SET_BATCH_PROGRESS', progress }),
        cancelRef.current,
        (index, game) => dispatch({ type: 'UPDATE_GAME_ANALYSIS', index, game })
      );

      if (cancelRef.current.cancelled) {
        const warning = buildWarningSummary(summary.fetched, summary.analyzed, summary.reused, true);
        dispatch({ type: 'SET_OPPONENT_WARNING', warning });
        return;
      }

      const warning = buildWarningSummary(summary.fetched, summary.analyzed, summary.reused, summary.cancelled);
      const report = generateWeaknessReport(analyzedGames, username.trim(), platform);
      if (warning) {
        report.warningSummary = warning;
      }

      await saveReport(platform, username.trim(), report);

      dispatch({ type: 'SET_FETCHED_GAMES', games: analyzedGames });
      dispatch({ type: 'SET_OPPONENT_REPORT', report });
      dispatch({ type: 'SET_OPPONENT_WARNING', warning });
      dispatch({ type: 'SET_ANALYZING_BATCH', isAnalyzing: false });
      dispatch({ type: 'SET_BATCH_PROGRESS', progress: null });
    } catch (e) {
      console.error('[OpponentScout] Error:', e);
      setError(e instanceof Error ? e.message : 'Failed to scout opponent');
      dispatch({ type: 'SET_FETCHING', isFetching: false });
      dispatch({ type: 'SET_ANALYZING_BATCH', isAnalyzing: false });
      dispatch({
        type: 'SET_BATCH_PROGRESS',
        progress: {
          currentGame: 0,
          totalGames: 0,
          currentGameMoveProgress: 0,
          phase: 'error',
          message: e instanceof Error ? e.message : 'An error occurred',
        },
      });
    }
  }, [username, platform, gameCount, dispatch]);

  const handleCancel = useCallback(() => {
    cancelRef.current.cancelled = true;
    dispatch({ type: 'SET_FETCHING', isFetching: false });
    dispatch({ type: 'SET_ANALYZING_BATCH', isAnalyzing: false });
    dispatch({
      type: 'SET_BATCH_PROGRESS',
      progress: { currentGame: 0, totalGames: 0, currentGameMoveProgress: 0, phase: 'cancelled', message: 'Cancelled' },
    });
  }, [dispatch]);

  const isRunning = state.isFetching || state.isAnalyzingBatch;

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-6">
      <h3 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold text-text-primary mb-4">
        Scout an Opponent
      </h3>
      <p className="text-text-secondary text-[0.85rem] mb-6">
        Fetch your opponent&apos;s recent games and analyze their weaknesses with Stockfish.
      </p>

      <div className="mb-4">
        <label className="block text-text-secondary text-[0.8rem] font-medium mb-2">Platform</label>
        <div className="flex gap-2">
          {(['chesscom', 'lichess'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-md text-[0.85rem] font-medium transition-all cursor-pointer
                ${platform === p
                  ? 'bg-bg-tertiary text-gold border border-gold/30'
                  : 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary hover:text-text-primary'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {p === 'chesscom' ? 'Chess.com' : 'Lichess'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-text-secondary text-[0.8rem] font-medium mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={platform === 'chesscom' ? 'e.g. hikaru' : 'e.g. DrNykterstein'}
          disabled={isRunning}
          className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-md text-text-primary text-[0.9rem]
            placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
          onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleScout()}
        />
      </div>

      <div className="mb-6">
        <label className="block text-text-secondary text-[0.8rem] font-medium mb-2">
          Games to analyze: <span className="text-gold">{gameCount}</span>
        </label>
        <div className="flex gap-2">
          {GAME_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setGameCount(count)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-md text-[0.85rem] font-medium transition-all cursor-pointer
                ${gameCount === count
                  ? 'bg-bg-tertiary text-gold border border-gold/30'
                  : 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary hover:text-text-primary'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-text-muted text-[0.75rem] mt-1.5">
          {gameCount === 10 && 'Quick scan (~2-3 min)'}
          {gameCount === 25 && 'Standard analysis (~6-8 min)'}
          {gameCount === 50 && 'Deep analysis (~12-15 min)'}
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-[rgba(224,85,85,0.1)] border border-[rgba(224,85,85,0.3)] rounded-md text-blunder text-[0.85rem]">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleScout}
          disabled={isRunning || !username.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.9rem] font-semibold transition-all cursor-pointer
            bg-gradient-to-br from-gold-dim to-gold text-bg-deep hover:from-gold hover:to-gold-bright hover:shadow-[0_0_20px_rgba(201,162,39,0.15)]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Scout
        </button>

        {isRunning && (
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-md text-[0.85rem] font-medium border border-border text-text-secondary
              hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
