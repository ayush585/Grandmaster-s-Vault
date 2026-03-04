import type { GameData, FetchedGame } from '@/types';

export interface PreparedSelfAnalysis {
  games: FetchedGame[];
  selectedCount: number;
  reusedCount: number;
  toAnalyzeCount: number;
  inferredPlayerName: string;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function mapGameToFetchedGame(game: GameData): FetchedGame {
  return {
    id: game.id,
    platform: 'vault',
    url: `/game/${game.id}`,
    white: game.whiteName || 'White',
    black: game.blackName || 'Black',
    result: game.result || '*',
    date: game.date || '',
    timeControl: game.timeControl || '',
    pgn: game.pgn || '',
    moves: game.moves || [],
    fens: game.fens || [],
    analysis: game.analysis,
    whiteAccuracy: game.whiteAccuracy,
    blackAccuracy: game.blackAccuracy,
  };
}

export function selectRecentGames(games: GameData[], maxGames: number): GameData[] {
  return [...games]
    .sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime())
    .slice(0, Math.max(0, maxGames));
}

export function inferSelfPlayerName(games: FetchedGame[], preferredNames: string[]): string {
  const counts = new Map<string, number>();

  const addName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
  };

  games.forEach((g) => {
    addName(g.white);
    addName(g.black);
  });

  const preferred = preferredNames
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => ({ raw: n, key: normalizeName(n) }));

  if (preferred.length > 0 && counts.size > 0) {
    const candidates = [...counts.entries()].map(([name, count]) => ({
      name,
      key: normalizeName(name),
      count,
    }));

    const preferredMatches = candidates
      .filter((c) => preferred.some((p) => p.key === c.key))
      .sort((a, b) => b.count - a.count);

    if (preferredMatches.length > 0) {
      return preferredMatches[0].name;
    }
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top?.[0] || preferredNames[0] || 'You';
}

export function prepareSelfAnalysisGames(
  games: GameData[],
  maxGames: number,
  preferredNames: string[] = []
): PreparedSelfAnalysis {
  const selected = selectRecentGames(games, maxGames);
  const mapped = selected.map(mapGameToFetchedGame).filter((g) => g.moves.length > 0 && g.fens.length > 1);
  const reusedCount = mapped.filter((g) => !!(g.analysis && g.analysis.length > 0)).length;
  const inferredPlayerName = inferSelfPlayerName(mapped, preferredNames);

  return {
    games: mapped,
    selectedCount: mapped.length,
    reusedCount,
    toAnalyzeCount: Math.max(0, mapped.length - reusedCount),
    inferredPlayerName,
  };
}
