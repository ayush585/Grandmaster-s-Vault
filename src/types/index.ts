export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface MoveAnalysis {
  ply: number;
  san: string;
  fen: string;
  eval: number; // from white's perspective (in pawns)
  mate: number | null;
  bestMove: string; // UCI format
  bestMoveSan: string;
  pv: string; // principal variation
  depth: number;
  classification?: MoveClassification;
  cpLoss?: number; // centipawn loss for the moving player
  isWhiteMove: boolean;
}

export interface GameData {
  id: string;
  userId: string;
  whiteName: string;
  blackName: string;
  tournament: string;
  timeControl: string;
  date: string;
  result: string;
  pgn: string;
  moves: string[]; // SAN moves
  fens: string[]; // FEN at each position (including start)
  analysis?: MoveAnalysis[];
  whiteAccuracy?: number;
  blackAccuracy?: number;
  savedAt: string;
}

export interface EngineEval {
  eval: number; // in pawns, from side to move's perspective
  mate: number | null;
  bestMove: string; // UCI
  pv: string;
  depth: number;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  currentEval?: EngineEval;
}

export const CLASSIFICATION_THRESHOLDS = {
  best: 0.0,
  excellent: 0.1,
  good: 0.3,
  inaccuracy: 0.5,
  mistake: 1.0,
  blunder: 2.0,
} as const;

export const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: '#26c9c3',
  great: '#5c9fe6',
  best: '#7bc96a',
  good: '#a0c96a',
  book: '#9994a8',
  inaccuracy: '#e8c63a',
  mistake: '#e69a3b',
  blunder: '#e05555',
};

export const CLASSIFICATION_SYMBOLS: Record<MoveClassification, string> = {
  brilliant: '!!',
  great: '!',
  best: '✓',
  good: '',
  book: '📖',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
};
