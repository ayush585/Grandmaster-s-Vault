import type { MoveAnalysis, MoveClassification } from './index';

export type ChessPlatform = 'chesscom' | 'lichess' | 'vault';
export type GamePhase = 'opening' | 'middlegame' | 'endgame';

export interface ScoutWarningSummary {
  fetched: number;
  analyzed: number;
  skipped: number;
  reused: number;
  message: string;
}

export type SelfAnalysisSide = 'both' | 'white' | 'black';

export interface SelfAnalysisOptions {
  playerName: string;
  side: SelfAnalysisSide;
}

export interface FetchedGame {
  id: string;
  platform: ChessPlatform;
  url: string;
  white: string;
  black: string;
  result: string;
  date: string;
  timeControl: string;
  pgn: string;
  moves: string[];
  fens: string[];
  analysis?: MoveAnalysis[];
  whiteAccuracy?: number;
  blackAccuracy?: number;
}

export interface BatchAnalysisProgress {
  currentGame: number;
  totalGames: number;
  currentGameMoveProgress: number;
  phase: 'fetching' | 'parsing' | 'analyzing' | 'done' | 'cancelled' | 'error';
  message: string;
}

export interface OpeningStats {
  eco: string;
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  avgAccuracy: number;
}

export interface PhaseStats {
  phase: GamePhase;
  avgAccuracy: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  totalMoves: number;
}

export interface BlunderPattern {
  type: string;
  label: string;
  count: number;
  examples: Array<{
    fen: string;
    move: string;
    bestMove: string;
    cpLoss: number;
    gameIndex: number;
  }>;
}

export type ClassificationDistribution = Record<MoveClassification, number>;

export interface WeaknessReport {
  username: string;
  platform: ChessPlatform;
  gamesAnalyzed: number;
  overallAccuracy: number;
  phaseStats: PhaseStats[];
  openingStats: OpeningStats[];
  blunderPatterns: BlunderPattern[];
  classificationDistribution: ClassificationDistribution;
  weaknesses: string[];
  suggestedPuzzleThemes: string[];
  generatedAt: string;
  warningSummary?: ScoutWarningSummary;
}

export interface LichessPuzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
  url: string;
}

export type PuzzleFetchErrorCode = 'THEME_UNAVAILABLE' | 'NETWORK_ERROR' | 'CANCELLED';

export interface PuzzleIndexSchema {
  version: number;
  generatedAt: string;
  source: string;
  targetPerTheme: number;
  themes: Record<string, string[]>;
}

export type PuzzleResult = 'solved' | 'failed' | 'skipped';

export interface PuzzleAttempt {
  puzzleId: string;
  result: PuzzleResult;
  theme: string;
}

export interface PuzzleSession {
  theme: string;
  themeLabel: string;
  puzzles: LichessPuzzle[];
  currentIndex: number;
  attempts: PuzzleAttempt[];
  active: boolean;
}

export type ScoutSubTab = 'opponent' | 'self' | 'puzzles';

export interface ScoutState {
  activeTab: ScoutSubTab;
  fetchedGames: FetchedGame[];
  isFetching: boolean;
  batchProgress: BatchAnalysisProgress | null;
  isAnalyzingBatch: boolean;
  opponentReport: WeaknessReport | null;
  selfReport: WeaknessReport | null;
  opponentWarning: ScoutWarningSummary | null;
  selfWarning: ScoutWarningSummary | null;
  preferredPuzzleThemes: string[];
  puzzleSession: PuzzleSession | null;
}

export interface CachedGameEntry {
  id: string;
  platform: ChessPlatform;
  username: string;
  game: FetchedGame;
  fetchedAt: string;
}

export interface CachedReport {
  id: string;
  platform: ChessPlatform;
  username: string;
  report: WeaknessReport;
  savedAt: string;
}
