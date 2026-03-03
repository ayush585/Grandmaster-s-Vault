import { Chess } from 'chess.js';

const MAX_INPUT_SIZE = 500_000;
const MAX_MOVES = Number(process.env.NEXT_PUBLIC_MAX_MOVES) || 500; // configurable via env

export interface ParseResult {
  success: boolean;
  moves: string[];
  fens: string[];
  pgn: string;
  error?: string;
  warning?: string;
  headers?: Record<string, string>;
}

export function parseMoves(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, moves: [], fens: [], pgn: '', error: 'No moves provided' };
  }

  if (trimmed.length > MAX_INPUT_SIZE) {
    return {
      success: false,
      moves: [],
      fens: [],
      pgn: '',
      error: `Input too large (${trimmed.length.toLocaleString()} chars). Max is ${MAX_INPUT_SIZE.toLocaleString()} characters.`,
    };
  }

  // Try as full PGN first (with or without headers)
  const pgnResult = tryParsePGN(trimmed);
  if (pgnResult.success) return pgnResult;

  // Try cleaning up the input and parsing as move list
  const cleaned = cleanMoveText(trimmed);
  const cleanResult = tryParsePGN(cleaned);
  if (cleanResult.success) return cleanResult;

  // Try parsing move by move
  const moveByMove = tryParseMoveByMove(trimmed);
  if (moveByMove.success) return moveByMove;

  return {
    success: false,
    moves: [],
    fens: [],
    pgn: '',
    error: 'Could not parse moves. Please use standard algebraic notation (e.g., "1. e4 e5 2. Nf3 Nc6").',
  };
}

function tryParsePGN(pgn: string): ParseResult {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);

    const history = chess.history();
    if (history.length === 0) {
      return { success: false, moves: [], fens: [], pgn: '', error: 'No valid moves found' };
    }

    if (history.length > MAX_MOVES) {
      return {
        success: false,
        moves: [],
        fens: [],
        pgn: '',
        error: `Too many moves (${history.length}). Max is ${MAX_MOVES}.`,
      };
    }

    // Replay to collect FENs
    const fens: string[] = [];
    const replay = new Chess();
    fens.push(replay.fen());

    for (const move of history) {
      replay.move(move);
      fens.push(replay.fen());
    }

    // Extract headers
    const headers: Record<string, string> = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match;
    while ((match = headerRegex.exec(pgn)) !== null) {
      headers[match[1]] = match[2];
    }

    return {
      success: true,
      moves: history,
      fens,
      pgn: replay.pgn(),
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    };
  } catch {
    return { success: false, moves: [], fens: [], pgn: '', error: 'PGN parse failed' };
  }
}

function cleanMoveText(text: string): string {
  let clean = text;
  clean = clean.replace(/\[.*?\]\s*/g, '');
  clean = clean.replace(/\{[^}]*\}/g, '');
  clean = clean.replace(/\([^)]*\)/g, '');
  clean = clean.replace(/\$\d+/g, '');
  clean = clean.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/g, '');
  clean = clean.replace(/(\d+)\.\.\./g, '$1. ...');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

function tryParseMoveByMove(text: string): ParseResult {
  const cleaned = cleanMoveText(text);
  const tokens = cleaned
    .replace(/\d+\.\s*/g, '')
    .replace(/\.\.\.\s*/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !t.match(/^[\d.]+$/));

  if (tokens.length === 0) {
    return { success: false, moves: [], fens: [], pgn: '', error: 'No moves found' };
  }

  const chess = new Chess();
  const moves: string[] = [];
  const fens: string[] = [chess.fen()];
  let failedAt = -1;

  for (let i = 0; i < tokens.length; i++) {
    try {
      const result = chess.move(tokens[i]);
      if (result) {
        moves.push(result.san);
        fens.push(chess.fen());
      } else {
        failedAt = i;
        break;
      }
    } catch {
      failedAt = i;
      break;
    }
  }

  if (moves.length === 0) {
    return { success: false, moves: [], fens: [], pgn: '', error: 'No valid moves could be parsed' };
  }

  if (moves.length > MAX_MOVES) {
    return {
      success: false,
      moves: [],
      fens: [],
      pgn: '',
      error: `Too many moves (${moves.length}). Max is ${MAX_MOVES}.`,
    };
  }

  // Generate warning for partial parse
  let warning: string | undefined;
  if (failedAt >= 0 && failedAt < tokens.length) {
    warning = `Only ${moves.length} of ${tokens.length} moves could be parsed. Parsing stopped at "${tokens[failedAt]}".`;
  }

  return {
    success: true,
    moves,
    fens,
    pgn: chess.pgn(),
    warning,
  };
}

export function parsePGNFile(content: string): ParseResult {
  return parseMoves(content);
}
