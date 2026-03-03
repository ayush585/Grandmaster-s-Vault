'use client';

import type { MoveAnalysis } from '@/types';

interface EnginePanelProps {
  currentAnalysis?: MoveAnalysis;
  depth: number;
  evaluation: number;
  mate: number | null;
  pvLine: string;
  isAnalyzing: boolean;
}

export default function EnginePanel({ depth, evaluation, mate, pvLine, isAnalyzing }: EnginePanelProps) {
  const evalDisplay = mate !== null
    ? `M${Math.abs(mate)}`
    : (evaluation >= 0 ? '+' : '') + evaluation.toFixed(2);

  const evalLabel = mate !== null
    ? (mate > 0 ? 'White mates' : 'Black mates')
    : evaluation > 0.5
      ? 'White is better'
      : evaluation < -0.5
        ? 'Black is better'
        : 'Equal position';

  return (
    <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-brilliant">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Stockfish 16
          {isAnalyzing && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="ml-1" style={{ animation: 'spin 1.5s linear infinite' }}>
              <path d="M8 1v4M8 11v4M1 8h4M11 8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-text-tertiary">
          Depth: {depth || '—'}
        </span>
      </div>

      {/* Eval display */}
      <div className="px-4 py-3 flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-mono)] text-[2rem] font-bold text-text-primary tracking-tight leading-none">
          {evalDisplay}
        </span>
        <span className="text-[0.8rem] text-text-secondary">{evalLabel}</span>
      </div>

      {/* PV Line */}
      {pvLine && (
        <div className="px-4 pb-3 font-[family-name:var(--font-mono)] text-[0.75rem] text-text-tertiary leading-relaxed break-all">
          {pvLine.split(' ').slice(0, 10).join(' ')}
          {pvLine.split(' ').length > 10 && '...'}
        </div>
      )}
    </div>
  );
}
