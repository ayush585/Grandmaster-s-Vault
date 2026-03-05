import type { GameData, FetchedGame, SelfAnalysisOptions } from '@/types';

export interface PreparedSelfAnalysis {
  games: FetchedGame[];
  selectedCount: number;
  reusedCount: number;
  toAnalyzeCount: number;
  defaultPlayerName: string;
  playerOptions: string[];
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

export function getPlayerNameOptions(games: FetchedGame[]): string[] {
  const counts = new Map<string, number>();

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
  };

  games.forEach((g) => {
    add(g.white);
    add(g.black);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

export function inferDefaultSelfPlayerName(games: FetchedGame[], preferredNames: string[]): string {
  const options = getPlayerNameOptions(games);
  if (options.length === 0) {
    return preferredNames[0] || 'You';
  }

  const preferredKeys = new Set(
    preferredNames
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => normalizeName(n))
  );

  const preferredHit = options.find((name) => preferredKeys.has(normalizeName(name)));
  if (preferredHit) return preferredHit;

  return options[0];
}

function matchesSide(game: FetchedGame, normalizedPlayerName: string, side: SelfAnalysisOptions['side']): boolean {
  const whiteMatch = normalizeName(game.white) === normalizedPlayerName;
  const blackMatch = normalizeName(game.black) === normalizedPlayerName;

  if (side === 'white') return whiteMatch;
  if (side === 'black') return blackMatch;
  return whiteMatch || blackMatch;
}

export function prepareSelfAnalysisGames(
  games: GameData[],
  maxGames: number,
  preferredNames: string[] = [],
  options?: SelfAnalysisOptions
): PreparedSelfAnalysis {
  const selected = selectRecentGames(games, maxGames);
  const mapped = selected.map(mapGameToFetchedGame).filter((g) => g.moves.length > 0 && g.fens.length > 1);
  const defaultPlayerName = inferDefaultSelfPlayerName(mapped, preferredNames);
  const playerOptions = getPlayerNameOptions(mapped);

  const playerName = options?.playerName?.trim() || defaultPlayerName;
  const normalizedPlayerName = normalizeName(playerName);
  const side = options?.side || 'both';

  const filtered = mapped.filter((g) => matchesSide(g, normalizedPlayerName, side));
  const reusedCount = filtered.filter((g) => !!(g.analysis && g.analysis.length > 0)).length;

  return {
    games: filtered,
    selectedCount: filtered.length,
    reusedCount,
    toAnalyzeCount: Math.max(0, filtered.length - reusedCount),
    defaultPlayerName,
    playerOptions,
  };
}
