import { describe, expect, it } from 'vitest';
import type { GameData, MoveAnalysis } from '@/types';
import { generateWeaknessReport } from '@/lib/weakness-analyzer';
import { prepareSelfAnalysisGames, selectRecentGames } from '@/lib/self-analysis';

const sampleAnalysis: MoveAnalysis[] = [
  {
    ply: 1,
    san: 'e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    eval: 0.2,
    mate: null,
    bestMove: 'e7e5',
    bestMoveSan: 'e5',
    pv: 'e5 Nf3',
    depth: 12,
    classification: 'good',
    cpLoss: 10,
    isWhiteMove: true,
  },
];

function createGame(
  id: string,
  savedAt: string,
  withAnalysis = false,
  whiteName = 'Player',
  blackName = 'Opponent'
): GameData {
  return {
    id,
    userId: 'u1',
    whiteName,
    blackName,
    tournament: 'Test Event',
    timeControl: '10+0',
    date: '2026-01-01',
    result: '1-0',
    pgn: '1. e4 e5',
    moves: ['e4', 'e5'],
    fens: [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    ],
    analysis: withAnalysis ? sampleAnalysis : undefined,
    whiteAccuracy: withAnalysis ? 91 : undefined,
    blackAccuracy: withAnalysis ? 88 : undefined,
    savedAt,
  };
}

describe('self-analysis preparation', () => {
  it('selects most recent games first', () => {
    const games = [
      createGame('g1', '2026-01-01T00:00:00.000Z'),
      createGame('g2', '2026-03-01T00:00:00.000Z'),
      createGame('g3', '2026-02-01T00:00:00.000Z'),
    ];

    const selected = selectRecentGames(games, 2);
    expect(selected.map((g) => g.id)).toEqual(['g2', 'g3']);
  });

  it('counts reused analysis and pending analysis correctly', () => {
    const games = [
      createGame('g1', '2026-03-01T00:00:00.000Z', true),
      createGame('g2', '2026-02-01T00:00:00.000Z', false),
    ];

    const prepared = prepareSelfAnalysisGames(games, 10, ['Player']);
    expect(prepared.selectedCount).toBe(2);
    expect(prepared.reusedCount).toBe(1);
    expect(prepared.toAnalyzeCount).toBe(1);
    expect(prepared.defaultPlayerName).toBe('Player');
  });

  it('filters by selected identity and side', () => {
    const games = [
      createGame('g1', '2026-03-01T00:00:00.000Z', false, 'Player', 'Rival'),
      createGame('g2', '2026-02-01T00:00:00.000Z', false, 'Rival', 'Player'),
      createGame('g3', '2026-01-01T00:00:00.000Z', false, 'Someone', 'Else'),
    ];

    const whiteOnly = prepareSelfAnalysisGames(games, 10, ['Player'], { playerName: 'Player', side: 'white' });
    expect(whiteOnly.games).toHaveLength(1);
    expect(whiteOnly.games[0].id).toBe('g1');

    const blackOnly = prepareSelfAnalysisGames(games, 10, ['Player'], { playerName: 'Player', side: 'black' });
    expect(blackOnly.games).toHaveLength(1);
    expect(blackOnly.games[0].id).toBe('g2');
  });

  it('returns empty result for no matching identity/side', () => {
    const games = [
      createGame('g1', '2026-03-01T00:00:00.000Z', false, 'Player', 'Rival'),
    ];

    const prepared = prepareSelfAnalysisGames(games, 10, ['Player'], {
      playerName: 'Unknown',
      side: 'both',
    });

    expect(prepared.games).toHaveLength(0);
    expect(prepared.selectedCount).toBe(0);
  });

  it('still generates report from partially analyzed input', () => {
    const games = [
      {
        ...createGame('g1', '2026-03-01T00:00:00.000Z', true),
        platform: 'vault' as const,
        url: '/game/g1',
        white: 'Player',
        black: 'Opponent',
      },
      {
        ...createGame('g2', '2026-02-01T00:00:00.000Z', false),
        platform: 'vault' as const,
        url: '/game/g2',
        white: 'Player',
        black: 'Opponent',
      },
    ];

    const report = generateWeaknessReport(games, 'Player', 'vault');
    expect(report.gamesAnalyzed).toBe(1);
    expect(report.overallAccuracy).toBeGreaterThan(0);
  });
});
