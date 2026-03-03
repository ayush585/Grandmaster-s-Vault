'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { getSharedGame } from '@/lib/sharing';
import type { GameData, MoveAnalysis, MoveClassification } from '@/types';
import { CLASSIFICATION_COLORS } from '@/types';
import EvalBar from '@/components/EvalBar';
import EvalChart from '@/components/EvalChart';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function SharedGamePage() {
  const params = useParams();
  const id = params.id as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMove, setCurrentMove] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getSharedGame(id);
        if (data) {
          setGame(data);
        } else {
          setError('Game not found. The link may be invalid or the game has been removed.');
        }
      } catch {
        setError('Failed to load game. Please try again later.');
      }
      setLoading(false);
    })();
  }, [id]);

  const fens = game?.fens || [START_FEN];
  const moves = game?.moves || [];
  const analysis = game?.analysis || [];
  const currentFen = fens[currentMove] || START_FEN;

  const currentEval = currentMove > 0 && analysis[currentMove - 1]
    ? analysis[currentMove - 1].eval
    : 0;
  const currentMate = currentMove > 0 && analysis[currentMove - 1]
    ? analysis[currentMove - 1].mate
    : null;

  const lastMove = useMemo(() => {
    if (currentMove === 0 || !fens[currentMove - 1] || !moves[currentMove - 1]) return null;
    try {
      const chess = new Chess(fens[currentMove - 1]);
      const m = chess.move(moves[currentMove - 1]);
      if (m) return { from: m.from, to: m.to };
    } catch { /* ignore */ }
    return null;
  }, [currentMove, fens, moves]);

  const customSquareStyles = useCallback(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { background: 'rgba(255, 255, 100, 0.35)' };
      styles[lastMove.to] = { background: 'rgba(255, 255, 100, 0.4)' };
    }
    return styles;
  }, [lastMove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrentMove((m) => Math.max(0, m - 1)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setCurrentMove((m) => Math.min(moves.length, m + 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setCurrentMove(0); }
    else if (e.key === 'End') { e.preventDefault(); setCurrentMove(moves.length); }
  }, [moves.length]);

  // Classify mistakes for the "Your Mistakes" section
  const mistakes = useMemo(() => {
    return analysis.filter((m) =>
      m.classification === 'inaccuracy' || m.classification === 'mistake' || m.classification === 'blunder'
    );
  }, [analysis]);

  // Classification counts per side
  const classificationCounts = useMemo(() => {
    const white: Record<MoveClassification, number> = { brilliant: 0, great: 0, best: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    const black: Record<MoveClassification, number> = { brilliant: 0, great: 0, best: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    for (const m of analysis) {
      if (m.classification) {
        (m.isWhiteMove ? white : black)[m.classification]++;
      }
    }
    return { white, black };
  }, [analysis]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="text-center">
          <span className="text-[3rem] text-gold block mb-4" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>♛</span>
          <p className="text-text-tertiary text-[0.9rem]">Loading game analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="text-center max-w-[400px] px-6">
          <span className="text-[3rem] opacity-30 block mb-4">♔</span>
          <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] font-bold text-text-primary mb-3">
            Game Not Found
          </h2>
          <p className="text-text-secondary text-[0.9rem] mb-6">{error}</p>
          <a
            href="/"
            className="px-6 py-2.5 rounded-md text-[0.85rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
              hover:shadow-[0_0_20px_rgba(201,162,39,0.15)] transition-all inline-block"
          >
            Go to Grandmaster&apos;s Vault
          </a>
        </div>
      </div>
    );
  }

  const hasAnalysis = analysis.length > 0;

  const classificationLabels: Array<{ key: MoveClassification; label: string }> = [
    { key: 'best', label: 'Best' },
    { key: 'good', label: 'Good' },
    { key: 'inaccuracy', label: 'Inaccuracy' },
    { key: 'mistake', label: 'Mistake' },
    { key: 'blunder', label: 'Blunder' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-deep" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Minimal header */}
      <header className="h-[50px] flex items-center justify-between px-5 bg-bg-primary border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[22px] text-gold">♛</span>
          <span className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold text-text-primary tracking-wide">
            Game Analysis
          </span>
        </div>
        <div className="font-[family-name:var(--font-display)] text-[0.95rem] text-text-secondary">
          {game.whiteName || 'White'} <span className="text-text-muted italic">vs</span> {game.blackName || 'Black'}
          {game.result && <span className="ml-2 font-[family-name:var(--font-mono)] text-gold font-bold">{game.result}</span>}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[auto_1fr] min-h-0">
        {/* Left: Board */}
        <section className="p-4 lg:p-6 flex flex-col gap-3 items-center bg-bg-primary lg:border-r border-border">
          <div className="flex gap-2 items-stretch">
            <EvalBar evaluation={currentEval} mate={currentMate} />
            <div className="w-[min(512px,calc(100vw-80px))] aspect-square">
              <Chessboard
                options={{
                  id: 'shared-board',
                  position: currentFen,
                  boardOrientation: flipped ? 'black' : 'white',
                  boardStyle: {
                    borderRadius: '2px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(201, 162, 39, 0.3)',
                  },
                  darkSquareStyle: { backgroundColor: '#b08762' },
                  lightSquareStyle: { backgroundColor: '#edd6ae' },
                  squareStyles: customSquareStyles(),
                  allowDragging: false,
                  animationDurationInMs: 200,
                }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between w-full max-w-[512px] ml-7">
            <div className="flex gap-1">
              {[
                { label: '⏮', title: 'First move', action: () => setCurrentMove(0) },
                { label: '◁', title: 'Previous', action: () => setCurrentMove(Math.max(0, currentMove - 1)) },
                { label: '▷', title: 'Next', action: () => setCurrentMove(Math.min(moves.length, currentMove + 1)) },
                { label: '⏭', title: 'Last move', action: () => setCurrentMove(moves.length) },
              ].map((btn) => (
                <button
                  key={btn.title}
                  onClick={btn.action}
                  title={btn.title}
                  className="w-10 h-9 border border-border bg-bg-secondary text-text-secondary text-[0.85rem] rounded-md
                    hover:bg-bg-tertiary hover:text-text-primary hover:border-border-accent active:scale-95
                    transition-all cursor-pointer flex items-center justify-center"
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFlipped(!flipped)}
              title="Flip board"
              className="w-10 h-9 border border-border bg-bg-secondary text-text-secondary text-[0.85rem] rounded-md
                hover:bg-bg-tertiary hover:text-text-primary hover:border-border-accent active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              ⟳
            </button>
          </div>

          {/* Game Info */}
          <div className="w-full max-w-[548px] p-3 bg-bg-secondary border border-border rounded-lg">
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-[0.82rem]">
              {game.tournament && (
                <div className="flex flex-col">
                  <span className="text-[0.6rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Tournament</span>
                  <span className="text-text-primary">{game.tournament}</span>
                </div>
              )}
              {game.timeControl && (
                <div className="flex flex-col">
                  <span className="text-[0.6rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Time Control</span>
                  <span className="text-text-primary">{game.timeControl}</span>
                </div>
              )}
              {game.date && (
                <div className="flex flex-col">
                  <span className="text-[0.6rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Date</span>
                  <span className="text-text-primary">{game.date}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Analysis sidebar */}
        <aside className="p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto lg:max-h-[calc(100vh-50px)]">
          {/* Accuracy — large and prominent */}
          {hasAnalysis && (
            <div className="bg-bg-primary border border-border rounded-lg p-4">
              <h3 className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold text-text-primary mb-3 pb-2 border-b border-border">
                Accuracy
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-bg-secondary text-center">
                  <div className="text-[0.7rem] uppercase tracking-[0.1em] text-text-tertiary font-semibold mb-1">
                    {game.whiteName || 'White'}
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-[2rem] font-bold text-[#f5f0e8]">
                    {game.whiteAccuracy ?? 0}%
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary text-center">
                  <div className="text-[0.7rem] uppercase tracking-[0.1em] text-text-tertiary font-semibold mb-1">
                    {game.blackName || 'Black'}
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-[2rem] font-bold text-text-secondary">
                    {game.blackAccuracy ?? 0}%
                  </div>
                </div>
              </div>

              {/* Classification bars */}
              <div className="mt-4 grid grid-cols-2 gap-1.5">
                {classificationLabels.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-2 px-3 bg-bg-secondary rounded text-[0.8rem]">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <span className="w-2 h-2 rounded-full" style={{ background: CLASSIFICATION_COLORS[key] }} />
                      {label}
                    </div>
                    <span className="font-[family-name:var(--font-mono)] font-semibold text-text-primary">
                      {classificationCounts.white[key]}/{classificationCounts.black[key]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[0.68rem] text-text-muted mt-2 text-center">White / Black</p>
            </div>
          )}

          {/* Your Mistakes — prominent */}
          {mistakes.length > 0 && (
            <div className="bg-bg-primary border border-border rounded-lg p-4">
              <h3 className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold text-text-primary mb-3 pb-2 border-b border-border">
                Key Mistakes
              </h3>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                {mistakes.map((m, i) => {
                  const moveNum = Math.ceil(m.ply / 2);
                  const prefix = m.isWhiteMove ? `${moveNum}. ` : `${moveNum}... `;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentMove(m.ply)}
                      className="w-full flex items-center gap-3 p-2.5 px-3 bg-bg-secondary rounded-md text-[0.8rem] text-left
                        hover:bg-bg-tertiary transition-all cursor-pointer group"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: CLASSIFICATION_COLORS[m.classification!] }}
                      />
                      <span className="font-[family-name:var(--font-mono)] text-text-primary font-medium">
                        {prefix}{m.san}
                      </span>
                      <span className="text-text-tertiary capitalize text-[0.75rem]">{m.classification}</span>
                      {m.cpLoss != null && m.cpLoss > 0 && (
                        <span className="text-[0.7rem] text-text-muted font-[family-name:var(--font-mono)]">
                          -{m.cpLoss}cp
                        </span>
                      )}
                      {m.bestMoveSan && (
                        <span className="text-text-muted ml-auto text-[0.75rem] group-hover:text-text-secondary">
                          Best: <span className="text-best font-[family-name:var(--font-mono)]">{m.bestMoveSan}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Move List */}
          <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary">
                Moves
              </h3>
            </div>
            <SharedMoveList moves={moves} analysis={analysis} currentMove={currentMove} onMoveClick={setCurrentMove} />
          </div>

          {/* Eval Chart */}
          {hasAnalysis && (
            <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary">
                  Evaluation Graph
                </h3>
              </div>
              <EvalChart analysis={analysis} currentMove={currentMove} onMoveClick={setCurrentMove} />
            </div>
          )}
        </aside>
      </main>

      {/* Footer */}
      <footer className="py-3 px-5 border-t border-border bg-bg-primary text-center">
        <a href="/" className="text-[0.75rem] text-text-tertiary hover:text-gold transition-colors">
          Powered by <span className="font-[family-name:var(--font-display)] font-semibold">Grandmaster&apos;s Vault</span>
        </a>
      </footer>
    </div>
  );
}

// Inline move list for shared page (simplified, no external dependencies on engine)
function SharedMoveList({ moves, analysis, currentMove, onMoveClick }: {
  moves: string[];
  analysis: MoveAnalysis[];
  currentMove: number;
  onMoveClick: (idx: number) => void;
}) {
  if (moves.length === 0) {
    return <div className="p-6 text-center text-text-tertiary text-[0.85rem]">No moves</div>;
  }

  const rows: Array<{
    number: number;
    white: { san: string; idx: number; cls?: MoveClassification };
    black?: { san: string; idx: number; cls?: MoveClassification };
  }> = [];

  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      number: Math.floor(i / 2) + 1,
      white: { san: moves[i], idx: i + 1, cls: analysis[i]?.classification },
      black: i + 1 < moves.length
        ? { san: moves[i + 1], idx: i + 2, cls: analysis[i + 1]?.classification }
        : undefined,
    });
  }

  return (
    <div className="max-h-[280px] overflow-y-auto p-2">
      {rows.map((row) => (
        <div key={row.number} className="grid grid-cols-[32px_1fr_1fr] gap-0.5 py-px">
          <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-text-muted text-right pr-1.5 py-1 font-medium">
            {row.number}.
          </span>
          <button
            onClick={() => onMoveClick(row.white.idx)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-left cursor-pointer
              font-[family-name:var(--font-mono)] text-[0.82rem] transition-all
              ${currentMove === row.white.idx
                ? 'bg-bg-elevated text-gold font-semibold'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
          >
            {row.white.cls && (
              <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: CLASSIFICATION_COLORS[row.white.cls] }} />
            )}
            {row.white.san}
          </button>
          {row.black ? (
            <button
              onClick={() => onMoveClick(row.black!.idx)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-left cursor-pointer
                font-[family-name:var(--font-mono)] text-[0.82rem] transition-all
                ${currentMove === row.black.idx
                  ? 'bg-bg-elevated text-gold font-semibold'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
            >
              {row.black.cls && (
                <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: CLASSIFICATION_COLORS[row.black.cls] }} />
              )}
              {row.black.san}
            </button>
          ) : <div />}
        </div>
      ))}
    </div>
  );
}
