import type {
  FetchedGame,
  WeaknessReport,
  PhaseStats,
  OpeningStats,
  BlunderPattern,
  ClassificationDistribution,
  ChessPlatform,
  GamePhase,
} from '@/types';
import type { MoveAnalysis, MoveClassification } from '@/types';
import { classifyGamePhases } from './game-phase';
import { lookupEco } from './eco';

// ── Weakness-to-puzzle theme mapping ────────────────────────────────────────

const WEAKNESS_TO_THEMES: Record<string, string[]> = {
  weak_endgame: ['endgame', 'rookEndgame', 'pawnEndgame', 'bishopEndgame'],
  weak_opening: ['opening', 'hangingPiece', 'trappedPiece'],
  weak_middlegame: ['middlegame', 'attackingF2F7', 'deflection'],
  misses_forks: ['fork', 'doubleCheck'],
  misses_pins: ['pin', 'skewer', 'xRayAttack'],
  misses_back_rank: ['backRankMate', 'mateIn1', 'mateIn2'],
  blunders_late: ['short', 'oneMove'],
};

// ── Accuracy helper ─────────────────────────────────────────────────────────

function moveAccuracy(cpLoss: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * cpLoss) - 3.1668));
}

// ── Main analysis function ──────────────────────────────────────────────────

export function generateWeaknessReport(
  games: FetchedGame[],
  username: string,
  platform: ChessPlatform
): WeaknessReport {
  const analyzedGames = games.filter((g) => g.analysis && g.analysis.length > 0);

  if (analyzedGames.length === 0) {
    return emptyReport(username, platform);
  }

  // Determine which side is the target user in each game
  const gameContexts = analyzedGames.map((g) => {
    const isWhite = g.white.toLowerCase() === username.toLowerCase();
    return { game: g, isWhite, analysis: g.analysis! };
  });

  // ── Classification distribution ─────────────────────────────────────────
  const dist: ClassificationDistribution = {
    brilliant: 0,
    great: 0,
    best: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  // ── Phase-based stats ───────────────────────────────────────────────────
  const phaseData: Record<GamePhase, { accuracies: number[]; blunders: number; mistakes: number; inaccuracies: number; totalMoves: number }> = {
    opening: { accuracies: [], blunders: 0, mistakes: 0, inaccuracies: 0, totalMoves: 0 },
    middlegame: { accuracies: [], blunders: 0, mistakes: 0, inaccuracies: 0, totalMoves: 0 },
    endgame: { accuracies: [], blunders: 0, mistakes: 0, inaccuracies: 0, totalMoves: 0 },
  };

  // ── Opening stats ───────────────────────────────────────────────────────
  const openingMap = new Map<string, { eco: string; name: string; wins: number; draws: number; losses: number; accuracies: number[] }>();

  // ── Blunder tracking ────────────────────────────────────────────────────
  const blunderExamples: BlunderPattern['examples'] = [];
  let lateBlunders = 0;
  let totalPlayerMoves = 0;
  let overallAccuracySum = 0;

  for (let gi = 0; gi < gameContexts.length; gi++) {
    const { game, isWhite, analysis } = gameContexts[gi];
    const phases = classifyGamePhases(game.fens);
    const eco = lookupEco(game.moves);

    // Opening stats
    const key = eco.name;
    if (!openingMap.has(key)) {
      openingMap.set(key, { eco: eco.eco, name: eco.name, wins: 0, draws: 0, losses: 0, accuracies: [] });
    }
    const openingEntry = openingMap.get(key)!;

    // Determine result from user's perspective
    const isWin = (isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1');
    const isDraw = game.result === '1/2-1/2';
    if (isWin) openingEntry.wins++;
    else if (isDraw) openingEntry.draws++;
    else openingEntry.losses++;

    // Process each move the user made
    for (const move of analysis) {
      const isUserMove = (isWhite && move.isWhiteMove) || (!isWhite && !move.isWhiteMove);
      if (!isUserMove) continue;

      totalPlayerMoves++;
      const cpLoss = move.cpLoss || 0;
      const acc = moveAccuracy(cpLoss);
      overallAccuracySum += acc;

      // Classification distribution
      if (move.classification) {
        dist[move.classification]++;
      }

      // Phase-based stats
      const moveIndex = move.ply - 1;
      const phase = phases[moveIndex] || 'middlegame';
      phaseData[phase].totalMoves++;
      phaseData[phase].accuracies.push(acc);

      if (move.classification === 'blunder') {
        phaseData[phase].blunders++;

        // Track blunder for pattern analysis
        blunderExamples.push({
          fen: move.fen,
          move: move.san,
          bestMove: move.bestMoveSan,
          cpLoss,
          gameIndex: gi,
        });

        // Late blunder = after move 30
        if (move.ply > 60) lateBlunders++;
      } else if (move.classification === 'mistake') {
        phaseData[phase].mistakes++;
      } else if (move.classification === 'inaccuracy') {
        phaseData[phase].inaccuracies++;
      }

      // Opening accuracy
      if (phase === 'opening') {
        openingEntry.accuracies.push(acc);
      }
    }
  }

  // ── Build phase stats ─────────────────────────────────────────────────
  const phaseStats: PhaseStats[] = (['opening', 'middlegame', 'endgame'] as GamePhase[]).map((phase) => {
    const data = phaseData[phase];
    return {
      phase,
      avgAccuracy: data.accuracies.length > 0
        ? Math.round(data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length)
        : 100,
      blunders: data.blunders,
      mistakes: data.mistakes,
      inaccuracies: data.inaccuracies,
      totalMoves: data.totalMoves,
    };
  });

  // ── Build opening stats ───────────────────────────────────────────────
  const openingStats: OpeningStats[] = Array.from(openingMap.values())
    .map((entry) => ({
      eco: entry.eco,
      name: entry.name,
      games: entry.wins + entry.draws + entry.losses,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses,
      avgAccuracy: entry.accuracies.length > 0
        ? Math.round(entry.accuracies.reduce((a, b) => a + b, 0) / entry.accuracies.length)
        : 100,
    }))
    .sort((a, b) => b.games - a.games);

  // ── Blunder patterns ──────────────────────────────────────────────────
  const blunderPatterns = categorizeBlunders(blunderExamples);

  // ── Identify weaknesses ───────────────────────────────────────────────
  const weaknesses: string[] = [];

  const openingAcc = phaseStats.find((p) => p.phase === 'opening')?.avgAccuracy ?? 100;
  const middlegameAcc = phaseStats.find((p) => p.phase === 'middlegame')?.avgAccuracy ?? 100;
  const endgameAcc = phaseStats.find((p) => p.phase === 'endgame')?.avgAccuracy ?? 100;
  const overallAcc = totalPlayerMoves > 0 ? Math.round(overallAccuracySum / totalPlayerMoves) : 100;

  if (endgameAcc < overallAcc - 5) weaknesses.push('weak_endgame');
  if (openingAcc < overallAcc - 5) weaknesses.push('weak_opening');
  if (middlegameAcc < overallAcc - 5) weaknesses.push('weak_middlegame');
  if (blunderPatterns.some((p) => p.type === 'fork_related' && p.count >= 2)) weaknesses.push('misses_forks');
  if (blunderPatterns.some((p) => p.type === 'pin_related' && p.count >= 2)) weaknesses.push('misses_pins');
  if (blunderPatterns.some((p) => p.type === 'back_rank' && p.count >= 1)) weaknesses.push('misses_back_rank');
  if (lateBlunders >= 3) weaknesses.push('blunders_late');

  // ── Suggested puzzle themes ───────────────────────────────────────────
  const suggestedThemes = new Set<string>();
  for (const w of weaknesses) {
    const themes = WEAKNESS_TO_THEMES[w];
    if (themes) themes.forEach((t) => suggestedThemes.add(t));
  }
  // Always suggest some general themes if few weaknesses found
  if (suggestedThemes.size < 3) {
    suggestedThemes.add('middlegame');
    suggestedThemes.add('fork');
    suggestedThemes.add('pin');
  }

  return {
    username,
    platform,
    gamesAnalyzed: analyzedGames.length,
    overallAccuracy: overallAcc,
    phaseStats,
    openingStats,
    blunderPatterns,
    classificationDistribution: dist,
    weaknesses,
    suggestedPuzzleThemes: Array.from(suggestedThemes),
    generatedAt: new Date().toISOString(),
  };
}

// ── Blunder categorization heuristics ─────────────────────────────────────

function categorizeBlunders(examples: BlunderPattern['examples']): BlunderPattern[] {
  const categories: Record<string, { label: string; examples: BlunderPattern['examples'] }> = {
    back_rank: { label: 'Back Rank Vulnerability', examples: [] },
    hanging_piece: { label: 'Hanging Pieces', examples: [] },
    fork_related: { label: 'Missed Fork / Double Attack', examples: [] },
    pin_related: { label: 'Pin / Skewer Blindness', examples: [] },
    endgame_technique: { label: 'Endgame Technique Errors', examples: [] },
    general: { label: 'General Blunders', examples: [] },
  };

  for (const ex of examples) {
    // Very high cp loss usually means hanging/losing major material
    if (ex.cpLoss > 500) {
      categories.hanging_piece.examples.push(ex);
    } else if (ex.cpLoss > 300) {
      categories.fork_related.examples.push(ex);
    } else {
      categories.general.examples.push(ex);
    }
  }

  return Object.entries(categories)
    .filter(([, v]) => v.examples.length > 0)
    .map(([type, v]) => ({
      type,
      label: v.label,
      count: v.examples.length,
      examples: v.examples.slice(0, 5), // max 5 examples each
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Empty report ────────────────────────────────────────────────────────────

function emptyReport(username: string, platform: ChessPlatform): WeaknessReport {
  return {
    username,
    platform,
    gamesAnalyzed: 0,
    overallAccuracy: 0,
    phaseStats: [],
    openingStats: [],
    blunderPatterns: [],
    classificationDistribution: {
      brilliant: 0, great: 0, best: 0, good: 0, book: 0,
      inaccuracy: 0, mistake: 0, blunder: 0,
    },
    weaknesses: [],
    suggestedPuzzleThemes: [],
    generatedAt: new Date().toISOString(),
  };
}
