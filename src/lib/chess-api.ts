import { Chess } from 'chess.js';
import type { FetchedGame } from '@/types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(
  url: string,
  delayMs: number,
  opts?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(delayMs * Math.pow(2, attempt));
    } else if (attempt === 0 && delayMs > 0) {
      await sleep(delayMs);
    }

    const res = await fetch(url, opts);
    if (res.status === 429) {
      console.warn(`[chess-api] 429 rate limited, backing off (attempt ${attempt + 1})`);
      await sleep(60_000);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText} for ${url}`);
    }
    return res;
  }
  throw new Error(`Rate limited after ${maxRetries} retries for ${url}`);
}

function parsePgnToMovesAndFens(pgn: string): { moves: string[]; fens: string[] } | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history();
    if (history.length === 0) return null;

    const replay = new Chess();
    const fens = [START_FEN];
    for (const san of history) {
      replay.move(san);
      fens.push(replay.fen());
    }
    return { moves: history, fens };
  } catch {
    return null;
  }
}

function parseSanMovesToFens(moves: string[]): string[] {
  const chess = new Chess();
  const fens = [START_FEN];
  for (const san of moves) {
    try {
      chess.move(san);
      fens.push(chess.fen());
    } catch {
      break;
    }
  }
  return fens;
}

interface ChessComGame {
  url: string;
  pgn: string;
  white: { username: string; result: string };
  black: { username: string; result: string };
  time_control: string;
  end_time: number;
}

function chesscomResultToStandard(white: { result: string }, black: { result: string }): string {
  if (white.result === 'win') return '1-0';
  if (black.result === 'win') return '0-1';
  return '1/2-1/2';
}

export async function fetchChesscomGames(
  username: string,
  maxGames: number,
  signal?: { cancelled: boolean },
  onProgress?: (msg: string) => void
): Promise<FetchedGame[]> {
  onProgress?.(`Fetching archives for ${username}...`);

  const archivesRes = await rateLimitedFetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games/archives`,
    0,
    { headers: { 'User-Agent': 'GrandmastersVault/1.0' } }
  );
  const { archives } = (await archivesRes.json()) as { archives: string[] };

  if (!archives || archives.length === 0) {
    throw new Error(`No games found for Chess.com user "${username}"`);
  }

  const games: FetchedGame[] = [];
  const sortedArchives = [...archives].reverse();

  for (const archiveUrl of sortedArchives) {
    if (signal?.cancelled) break;
    if (games.length >= maxGames) break;

    onProgress?.(`Fetching games (${games.length}/${maxGames})...`);

    const res = await rateLimitedFetch(archiveUrl, 1000, {
      headers: { 'User-Agent': 'GrandmastersVault/1.0' },
    });
    const { games: monthGames } = (await res.json()) as { games: ChessComGame[] };

    for (const g of [...monthGames].reverse()) {
      if (games.length >= maxGames) break;
      if (!g.pgn) continue;

      const parsed = parsePgnToMovesAndFens(g.pgn);
      if (!parsed || parsed.moves.length < 5) continue;

      games.push({
        id: `chesscom_${g.end_time}`,
        platform: 'chesscom',
        url: g.url,
        white: g.white.username,
        black: g.black.username,
        result: chesscomResultToStandard(g.white, g.black),
        date: new Date(g.end_time * 1000).toISOString().split('T')[0],
        timeControl: g.time_control || 'unknown',
        pgn: g.pgn,
        moves: parsed.moves,
        fens: parsed.fens,
      });
    }
  }

  return games;
}

interface LichessGame {
  id: string;
  players: {
    white: { user?: { name: string } };
    black: { user?: { name: string } };
  };
  winner?: 'white' | 'black';
  createdAt: number;
  clock?: { initial: number; increment: number };
  moves?: string;
}

function lichessResultToStandard(game: LichessGame): string {
  if (game.winner === 'white') return '1-0';
  if (game.winner === 'black') return '0-1';
  return '1/2-1/2';
}

function lichessTimeControl(game: LichessGame): string {
  if (game.clock) {
    return `${game.clock.initial / 60}+${game.clock.increment}`;
  }
  return 'unknown';
}

export async function fetchLichessGames(
  username: string,
  maxGames: number,
  signal?: { cancelled: boolean },
  onProgress?: (msg: string) => void
): Promise<FetchedGame[]> {
  onProgress?.(`Fetching games for ${username} from Lichess...`);

  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${maxGames}&moves=true&pgnInBody=true`;

  const res = await rateLimitedFetch(url, 0, {
    headers: {
      Accept: 'application/x-ndjson',
    },
  });

  const text = await res.text();
  const lines = text.trim().split('\n').filter(Boolean);
  const games: FetchedGame[] = [];

  for (const line of lines) {
    if (signal?.cancelled) break;

    try {
      const g = JSON.parse(line) as LichessGame;
      if (!g.moves) continue;

      const movesArr = g.moves.split(' ');
      if (movesArr.length < 5) continue;

      const fens = parseSanMovesToFens(movesArr);
      if (fens.length < 6) continue;

      games.push({
        id: `lichess_${g.id}`,
        platform: 'lichess',
        url: `https://lichess.org/${g.id}`,
        white: g.players.white.user?.name || 'Anonymous',
        black: g.players.black.user?.name || 'Anonymous',
        result: lichessResultToStandard(g),
        date: new Date(g.createdAt).toISOString().split('T')[0],
        timeControl: lichessTimeControl(g),
        pgn: '',
        moves: movesArr,
        fens,
      });
    } catch {
      // skip invalid NDJSON rows
    }
  }

  onProgress?.(`Fetched ${games.length} games from Lichess`);
  return games;
}

export async function fetchGames(
  platform: 'chesscom' | 'lichess',
  username: string,
  maxGames: number,
  signal?: { cancelled: boolean },
  onProgress?: (msg: string) => void
): Promise<FetchedGame[]> {
  if (platform === 'chesscom') {
    return fetchChesscomGames(username, maxGames, signal, onProgress);
  }
  return fetchLichessGames(username, maxGames, signal, onProgress);
}
