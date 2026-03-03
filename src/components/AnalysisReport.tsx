'use client';

import type { MoveAnalysis, MoveClassification } from '@/types';
import { CLASSIFICATION_COLORS } from '@/types';

interface AnalysisReportProps {
  analysis: MoveAnalysis[];
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteName: string;
  blackName: string;
}

export default function AnalysisReport({
  analysis,
  whiteAccuracy,
  blackAccuracy,
  whiteName,
  blackName,
}: AnalysisReportProps) {
  const whiteMoves = analysis.filter((m) => m.isWhiteMove);
  const blackMoves = analysis.filter((m) => !m.isWhiteMove);

  const whiteStats = classificationCounts(whiteMoves);
  const blackStats = classificationCounts(blackMoves);

  const classificationLabels: Array<{ key: MoveClassification; label: string }> = [
    { key: 'best', label: 'Best' },
    { key: 'good', label: 'Good' },
    { key: 'inaccuracy', label: 'Inaccuracy' },
    { key: 'mistake', label: 'Mistake' },
    { key: 'blunder', label: 'Blunder' },
  ];

  return (
    <div className="p-4">
      {/* Accuracy */}
      <div className="mb-4">
        <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary mb-3 pb-1.5 border-b border-border">
          Accuracy
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-bg-secondary text-center">
            <div className="text-[0.7rem] uppercase tracking-[0.1em] text-text-tertiary font-semibold mb-1">
              {whiteName || 'White'}
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[1.5rem] font-bold text-[#f5f0e8]">
              {whiteAccuracy}%
            </div>
          </div>
          <div className="p-3 rounded-md bg-bg-secondary text-center">
            <div className="text-[0.7rem] uppercase tracking-[0.1em] text-text-tertiary font-semibold mb-1">
              {blackName || 'Black'}
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[1.5rem] font-bold text-text-secondary">
              {blackAccuracy}%
            </div>
          </div>
        </div>
      </div>

      {/* Move Classification Breakdown */}
      <div>
        <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary mb-3 pb-1.5 border-b border-border">
          Move Classifications
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {classificationLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-2 px-3 bg-bg-secondary rounded text-[0.8rem]">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: CLASSIFICATION_COLORS[key] }}
                />
                {label}
              </div>
              <span className="font-[family-name:var(--font-mono)] font-semibold text-text-primary">
                {whiteStats[key]}/{blackStats[key]}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[0.68rem] text-text-muted mt-2 text-center">White / Black</p>
      </div>

      {/* Key Moments */}
      {analysis.some((m) => m.classification === 'blunder' || m.classification === 'mistake') && (
        <div className="mt-4">
          <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary mb-3 pb-1.5 border-b border-border">
            Key Moments
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {analysis
              .filter((m) => m.classification === 'blunder' || m.classification === 'mistake')
              .slice(0, 10)
              .map((m, i) => {
                const moveNum = Math.ceil(m.ply / 2);
                const prefix = m.isWhiteMove ? `${moveNum}. ` : `${moveNum}... `;
                return (
                  <div key={i} className="flex items-center gap-3 p-2 px-3 bg-bg-secondary rounded text-[0.8rem]">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CLASSIFICATION_COLORS[m.classification!] }}
                    />
                    <span className="font-[family-name:var(--font-mono)] text-text-primary">
                      {prefix}{m.san}
                    </span>
                    <span className="text-text-tertiary capitalize">{m.classification}</span>
                    {m.bestMoveSan && (
                      <span className="text-text-muted ml-auto">
                        Best: <span className="text-best font-[family-name:var(--font-mono)]">{m.bestMoveSan}</span>
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function classificationCounts(moves: MoveAnalysis[]): Record<MoveClassification, number> {
  const counts: Record<MoveClassification, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
  for (const m of moves) {
    if (m.classification) counts[m.classification]++;
  }
  return counts;
}
