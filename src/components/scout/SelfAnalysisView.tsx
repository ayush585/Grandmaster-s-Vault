'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useScout } from '@/contexts/ScoutContext';
import { useAuth } from '@/hooks/useAuth';
import type { ScoutWarningSummary } from '@/types';
import { getAllGames } from '@/lib/storage';
import { batchAnalyzeGames } from '@/lib/batch-analyzer';
import { generateWeaknessReport } from '@/lib/weakness-analyzer';
import { getCachedReport, saveReport } from '@/lib/scouting-storage';
import { prepareSelfAnalysisGames } from '@/lib/self-analysis';

const GAME_COUNTS = [10, 25, 50] as const;

function buildWarningSummary(
  fetched: number,
  analyzed: number,
  reused: number,
  cancelled = false
): ScoutWarningSummary | null {
  const skipped = Math.max(0, fetched - analyzed);
  if (!cancelled && skipped <= 0) return null;

  return {
    fetched,
    analyzed,
    skipped,
    reused,
    message: cancelled
      ? `Run cancelled. Analyzed ${analyzed}/${fetched} games so far.`
      : `Partial analysis complete: ${analyzed}/${fetched} games analyzed, ${skipped} skipped.`,
  };
}

function emailAlias(email?: string | null): string {
  if (!email) return '';
  return email.split('@')[0] || '';
}

export default function SelfAnalysisView() {
  const { state, dispatch } = useScout();
  const { user } = useAuth();
  const [gameCount, setGameCount] = useState<number>(25);
  const [error, setError] = useState('');
  const [loadingCached, setLoadingCached] = useState(false);
  const cancelRef = useRef({ cancelled: false });

  useEffect(() => {
    const loadCached = async () => {
      if (!user || state.selfReport) return;
      setLoadingCached(true);
      try {
        const cached = await getCachedReport('vault', user.uid);
        if (cached) {
          dispatch({ type: 'SET_SELF_REPORT', report: cached });
          dispatch({ type: 'SET_SELF_WARNING', warning: cached.warningSummary || null });
        }
      } catch {
        // ignore cache load failures
      } finally {
        setLoadingCached(false);
      }
    };

    loadCached();
  }, [user, state.selfReport, dispatch]);

  const handleAnalyze = useCallback(async () => {
    if (!user) {
      setError('Please sign in to analyze your games.');
      return;
    }

    setError('');
    cancelRef.current = { cancelled: false };
    dispatch({ type: 'SET_FETCHING', isFetching: true });
    dispatch({ type: 'SET_SELF_WARNING', warning: null });
    dispatch({
      type: 'SET_BATCH_PROGRESS',
      progress: {
        currentGame: 0,
        totalGames: 0,
        currentGameMoveProgress: 0,
        phase: 'fetching',
        message: 'Loading your saved games...',
      },
    });

    try {
      const allGames = await getAllGames(user.uid);
      const preferredNames = [user.displayName || '', emailAlias(user.email)].filter(Boolean);
      const prepared = prepareSelfAnalysisGames(allGames, gameCount, preferredNames);

      if (prepared.games.length === 0) {
        setError('No suitable games found. Upload and save a few games first.');
        dispatch({ type: 'SET_FETCHING', isFetching: false });
        dispatch({ type: 'SET_BATCH_PROGRESS', progress: null });
        return;
      }

      dispatch({ type: 'SET_FETCHED_GAMES', games: prepared.games });
      dispatch({ type: 'SET_FETCHING', isFetching: false });
      dispatch({ type: 'SET_ANALYZING_BATCH', isAnalyzing: true });

      const { games: analyzedGames, summary } = await batchAnalyzeGames(
        prepared.games,
        (progress) => dispatch({ type: 'SET_BATCH_PROGRESS', progress }),
        cancelRef.current,
        (index, game) => dispatch({ type: 'UPDATE_GAME_ANALYSIS', index, game })
      );

      if (cancelRef.current.cancelled) {
        const cancelledWarning = buildWarningSummary(summary.fetched, summary.analyzed, summary.reused, true);
        dispatch({ type: 'SET_SELF_WARNING', warning: cancelledWarning });
        return;
      }

      const warning = buildWarningSummary(summary.fetched, summary.analyzed, summary.reused, summary.cancelled);
      const report = generateWeaknessReport(analyzedGames, prepared.inferredPlayerName, 'vault');
      if (warning) {
        report.warningSummary = warning;
      }

      await saveReport('vault', user.uid, report);

      dispatch({ type: 'SET_FETCHED_GAMES', games: analyzedGames });
      dispatch({ type: 'SET_SELF_REPORT', report });
      dispatch({ type: 'SET_SELF_WARNING', warning });
      dispatch({ type: 'SET_ANALYZING_BATCH', isAnalyzing: false });
      dispatch({ type: 'SET_BATCH_PROGRESS', progress: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze your games.');
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
  }, [dispatch, gameCount, user]);

  const handleCancel = useCallback(() => {
    cancelRef.current.cancelled = true;
    dispatch({ type: 'SET_FETCHING', isFetching: false });
    dispatch({ type: 'SET_ANALYZING_BATCH', isAnalyzing: false });
    dispatch({
      type: 'SET_BATCH_PROGRESS',
      progress: {
        currentGame: 0,
        totalGames: 0,
        currentGameMoveProgress: 0,
        phase: 'cancelled',
        message: 'Cancelled',
      },
    });
  }, [dispatch]);

  const isRunning = state.isFetching || state.isAnalyzingBatch;

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-6">
      <h3 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold text-text-primary mb-4">
        Analyze My Weaknesses
      </h3>
      <p className="text-text-secondary text-[0.85rem] mb-6">
        Use your saved Grandmaster&apos;s Vault games to build a personalized weakness report.
      </p>

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
      </div>

      {loadingCached && (
        <p className="mb-3 text-[0.78rem] text-text-muted">Loading cached self-report...</p>
      )}

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-[rgba(224,85,85,0.1)] border border-[rgba(224,85,85,0.3)] rounded-md text-blunder text-[0.85rem]">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={isRunning || !user}
          className="flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.9rem] font-semibold transition-all cursor-pointer
            bg-gradient-to-br from-gold-dim to-gold text-bg-deep hover:from-gold hover:to-gold-bright hover:shadow-[0_0_20px_rgba(201,162,39,0.15)]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 8a5.5 5.5 0 1011 0 5.5 5.5 0 00-11 0z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Analyze My Games
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
