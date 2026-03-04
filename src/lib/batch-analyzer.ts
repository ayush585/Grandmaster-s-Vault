import type { FetchedGame, BatchAnalysisProgress } from '@/types';
import { initEngine, analyzeGame, computeAccuracy } from './engine';

export interface BatchAnalyzeSummary {
  fetched: number;
  analyzed: number;
  skipped: number;
  reused: number;
  cancelled: boolean;
}

export async function batchAnalyzeGames(
  games: FetchedGame[],
  onProgress: (progress: BatchAnalysisProgress) => void,
  signal: { cancelled: boolean },
  onGameComplete?: (gameIndex: number, game: FetchedGame) => void
): Promise<{ games: FetchedGame[]; summary: BatchAnalyzeSummary }> {
  onProgress({
    currentGame: 0,
    totalGames: games.length,
    currentGameMoveProgress: 0,
    phase: 'analyzing',
    message: 'Preparing game analysis...',
  });

  const needsEngine = games.some((g) => !(g.analysis && g.analysis.length > 0));
  if (needsEngine) {
    await initEngine();
  }

  const results: FetchedGame[] = [];
  let reused = 0;
  let cancelled = false;

  for (let i = 0; i < games.length; i++) {
    if (signal.cancelled) {
      cancelled = true;
      onProgress({
        currentGame: i,
        totalGames: games.length,
        currentGameMoveProgress: 0,
        phase: 'cancelled',
        message: 'Analysis cancelled',
      });
      break;
    }

    const game = games[i];

    if (game.analysis && game.analysis.length > 0) {
      reused++;
      results.push(game);
      onProgress({
        currentGame: i + 1,
        totalGames: games.length,
        currentGameMoveProgress: 100,
        phase: 'analyzing',
        message: `Reused existing analysis for game ${i + 1}/${games.length}`,
      });
      onGameComplete?.(i, game);
      continue;
    }

    onProgress({
      currentGame: i + 1,
      totalGames: games.length,
      currentGameMoveProgress: 0,
      phase: 'analyzing',
      message: `Analyzing game ${i + 1} of ${games.length}: ${game.white} vs ${game.black}`,
    });

    try {
      const analysis = await analyzeGame(
        game.fens,
        game.moves,
        12,
        (progress) => {
          const pct = Math.round((progress.current / progress.total) * 100);
          onProgress({
            currentGame: i + 1,
            totalGames: games.length,
            currentGameMoveProgress: pct,
            phase: 'analyzing',
            message: `Game ${i + 1}/${games.length}: move ${Math.min(progress.current, game.moves.length)}/${game.moves.length}`,
          });
        },
        signal
      );

      const accuracy = computeAccuracy(analysis);
      const analyzedGame: FetchedGame = {
        ...game,
        analysis,
        whiteAccuracy: accuracy.white,
        blackAccuracy: accuracy.black,
      };

      results.push(analyzedGame);
      onGameComplete?.(i, analyzedGame);
    } catch (e) {
      console.error(`[batch-analyzer] Failed to analyze game ${i + 1}:`, e);
      results.push(game);
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  const analyzed = results.filter((g) => !!(g.analysis && g.analysis.length > 0)).length;
  const fetched = games.length;
  const skipped = Math.max(0, fetched - analyzed);

  if (!cancelled) {
    onProgress({
      currentGame: games.length,
      totalGames: games.length,
      currentGameMoveProgress: 100,
      phase: 'done',
      message: `Analysis complete: ${analyzed}/${fetched} games analyzed`,
    });
  }

  return {
    games: results,
    summary: {
      fetched,
      analyzed,
      skipped,
      reused,
      cancelled,
    },
  };
}
