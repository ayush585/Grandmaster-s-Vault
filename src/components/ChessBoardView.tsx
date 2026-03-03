'use client';

import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import EvalBar from './EvalBar';
import type { MoveAnalysis } from '@/types';
import type { AnalysisDepth } from '@/lib/engine';
import { DEPTH_LABELS } from '@/lib/engine';

interface ChessBoardViewProps {
  fen: string;
  currentMove: number;
  totalMoves: number;
  evaluation: number;
  mate: number | null;
  lastMove?: { from: string; to: string } | null;
  analysis?: MoveAnalysis[];
  whiteName?: string;
  blackName?: string;
  tournament?: string;
  timeControl?: string;
  result?: string;
  date?: string;
  onNavigate: (move: number) => void;
  onAnalyze: (depth: AnalysisDepth) => void;
  onExportPGN?: () => void;
  onPrint?: () => void;
  onShare?: () => Promise<string | null>;
  gameLoaded: boolean;
  isAnalyzing: boolean;
}

export default function ChessBoardView({
  fen,
  currentMove,
  totalMoves,
  evaluation,
  mate,
  lastMove,
  analysis,
  whiteName,
  blackName,
  tournament,
  timeControl,
  result,
  date,
  onNavigate,
  onAnalyze,
  onExportPGN,
  onPrint,
  onShare,
  gameLoaded,
  isAnalyzing,
}: ChessBoardViewProps) {
  const [flipped, setFlipped] = useState(false);
  const [selectedDepth, setSelectedDepth] = useState<AnalysisDepth>(16);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const customSquareStyles = useCallback(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { background: 'rgba(255, 255, 100, 0.35)' };
      styles[lastMove.to] = { background: 'rgba(255, 255, 100, 0.4)' };
    }
    return styles;
  }, [lastMove]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate(Math.max(0, currentMove - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate(Math.min(totalMoves, currentMove + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        onNavigate(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onNavigate(totalMoves);
      }
    },
    [currentMove, totalMoves, onNavigate]
  );

  const hasAnalysis = analysis && analysis.length > 0;

  return (
    <section
      className="p-7 pr-6 flex flex-col gap-4 items-center bg-bg-primary border-r border-border focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Board + Eval Bar */}
      <div className="flex gap-2 items-stretch">
        <EvalBar evaluation={evaluation} mate={mate} />
        <div style={{ width: 512, height: 512 }}>
          <Chessboard
            options={{
              id: 'analysis-board',
              position: fen,
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

      {/* Controls */}
      <div className="flex items-center justify-between w-[512px] ml-9">
        <div className="flex gap-1">
          {[
            { label: '⏮', title: 'First move', action: () => onNavigate(0) },
            { label: '◁', title: 'Previous', action: () => onNavigate(Math.max(0, currentMove - 1)) },
            { label: '▷', title: 'Next', action: () => onNavigate(Math.min(totalMoves, currentMove + 1)) },
            { label: '⏭', title: 'Last move', action: () => onNavigate(totalMoves) },
          ].map((btn) => (
            <button
              key={btn.title}
              onClick={btn.action}
              title={btn.title}
              disabled={!gameLoaded}
              className="w-10 h-9 border border-border bg-bg-secondary text-text-secondary text-[0.85rem] rounded-md
                hover:bg-bg-tertiary hover:text-text-primary hover:border-border-accent active:scale-95
                transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFlipped(!flipped)}
            title="Flip board"
            className="w-10 h-9 border border-border bg-bg-secondary text-text-secondary text-[0.85rem] rounded-md
              hover:bg-bg-tertiary hover:text-text-primary hover:border-border-accent active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            ⟳
          </button>

          {/* Depth selector */}
          <select
            value={selectedDepth}
            onChange={(e) => setSelectedDepth(Number(e.target.value) as AnalysisDepth)}
            disabled={isAnalyzing}
            title="Analysis depth"
            className="h-9 px-2 border border-border bg-bg-secondary text-text-secondary text-[0.75rem] rounded-md
              outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {([12, 16, 18, 20] as AnalysisDepth[]).map((d) => (
              <option key={d} value={d}>{DEPTH_LABELS[d]} (d{d})</option>
            ))}
          </select>

          <button
            onClick={() => onAnalyze(selectedDepth)}
            disabled={!gameLoaded || isAnalyzing}
            title={!gameLoaded ? 'Load a game first to analyze' : isAnalyzing ? 'Analysis in progress...' : 'Analyze with Stockfish'}
            className="h-9 px-4 border border-border-accent rounded-md text-[0.8rem] font-semibold text-gold
              bg-gradient-to-br from-[rgba(201,162,39,0.12)] to-[rgba(201,162,39,0.06)]
              hover:from-[rgba(201,162,39,0.2)] hover:to-[rgba(201,162,39,0.1)] hover:shadow-[0_0_20px_rgba(201,162,39,0.1)]
              active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
              flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1v4M8 11v4M1 8h4M11 8h4M3.05 3.05l2.83 2.83M10.12 10.12l2.83 2.83M3.05 12.95l2.83-2.83M10.12 5.88l2.83-2.83"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
            Analyze
          </button>
        </div>
      </div>

      {/* Export / Print / Share buttons (after analysis) */}
      {hasAnalysis && (
        <div className="flex gap-2 w-[548px] no-print relative">
          {onExportPGN && (
            <button
              onClick={onExportPGN}
              className="flex-1 h-9 border border-border bg-bg-secondary text-text-secondary text-[0.8rem] font-medium rounded-md
                hover:bg-bg-tertiary hover:text-text-primary hover:border-border-accent transition-all cursor-pointer
                flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 10v2a1 1 0 001 1h8a1 1 0 001-1v-2M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export PGN
            </button>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex-1 h-9 border border-border bg-bg-secondary text-text-secondary text-[0.8rem] font-medium rounded-md
                hover:bg-bg-tertiary hover:text-text-primary hover:border-border-accent transition-all cursor-pointer
                flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6V2h8v4M4 12H2.5A1.5 1.5 0 011 10.5v-3A1.5 1.5 0 012.5 6h11A1.5 1.5 0 0115 7.5v3a1.5 1.5 0 01-1.5 1.5H12M4 9h8v5H4V9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Print Report
            </button>
          )}
          {onShare && (
            <div className="relative">
              <button
                onClick={async () => {
                  if (shareUrl) {
                    setShareUrl(null);
                    return;
                  }
                  setSharing(true);
                  const url = await onShare();
                  setSharing(false);
                  if (url) {
                    setShareUrl(url);
                    navigator.clipboard.writeText(url).catch(() => {});
                  }
                }}
                disabled={sharing}
                className="h-9 px-3 border border-border-accent bg-[rgba(201,162,39,0.08)] text-gold text-[0.8rem] font-medium rounded-md
                  hover:bg-[rgba(201,162,39,0.15)] transition-all cursor-pointer disabled:opacity-50
                  flex items-center justify-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="12" cy="3" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5.8 7L10.2 4M5.8 9L10.2 12" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                {sharing ? 'Sharing...' : 'Share'}
              </button>
              {shareUrl && (
                <div className="absolute bottom-full mb-2 right-0 bg-bg-elevated border border-border rounded-lg shadow-2xl p-3 w-[300px] z-10">
                  <p className="text-[0.75rem] text-text-tertiary mb-2 font-semibold uppercase tracking-wider">Shareable Link</p>
                  <div className="flex gap-1.5">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-2.5 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary text-[0.78rem] font-[family-name:var(--font-mono)] outline-none"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                      }}
                      className="px-2.5 py-1.5 bg-bg-tertiary border border-border rounded text-text-secondary text-[0.75rem] font-semibold
                        hover:text-text-primary hover:border-border-accent transition-all cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[0.68rem] text-text-muted mt-1.5">Anyone with this link can view the analysis</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Game Info */}
      <div className="w-[548px] p-4 bg-bg-secondary border border-border rounded-lg min-h-[48px]">
        {gameLoaded ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-2">
            {whiteName && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">White</span>
                <span className="text-[0.9rem] text-text-primary font-medium">{whiteName}</span>
              </div>
            )}
            {blackName && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Black</span>
                <span className="text-[0.9rem] text-text-primary font-medium">{blackName}</span>
              </div>
            )}
            {tournament && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Tournament</span>
                <span className="text-[0.9rem] text-text-primary font-medium">{tournament}</span>
              </div>
            )}
            {timeControl && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Time Control</span>
                <span className="text-[0.9rem] text-text-primary font-medium">{timeControl}</span>
              </div>
            )}
            {date && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Date</span>
                <span className="text-[0.9rem] text-text-primary font-medium">{date}</span>
              </div>
            )}
            {result && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-tertiary font-semibold">Result</span>
                <span className="text-[0.9rem] font-[family-name:var(--font-mono)] font-bold text-gold">{result}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-text-tertiary text-[0.85rem]">
            <span className="text-[1.4rem] opacity-40">♟</span>
            <p>Upload a game score sheet to begin analysis</p>
          </div>
        )}
      </div>
    </section>
  );
}
