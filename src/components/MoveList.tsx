'use client';

import { useRef, useEffect } from 'react';
import type { MoveAnalysis, MoveClassification } from '@/types';
import { CLASSIFICATION_COLORS } from '@/types';

interface MoveListProps {
  moves: string[];
  analysis?: MoveAnalysis[];
  currentMove: number;
  onMoveClick: (moveIndex: number) => void;
}

export default function MoveList({ moves, analysis, currentMove, onMoveClick }: MoveListProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentMove]);

  if (moves.length === 0) {
    return (
      <div className="max-h-[280px] overflow-y-auto p-2">
        <div className="p-6 text-center text-text-tertiary text-[0.85rem]">No game loaded</div>
      </div>
    );
  }

  // Group moves into pairs (white, black)
  const rows: Array<{ number: number; white: { san: string; idx: number; cls?: MoveClassification }; black?: { san: string; idx: number; cls?: MoveClassification } }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    const whiteAnalysis = analysis?.[i];
    const blackAnalysis = analysis?.[i + 1];
    rows.push({
      number: Math.floor(i / 2) + 1,
      white: { san: moves[i], idx: i + 1, cls: whiteAnalysis?.classification },
      black: i + 1 < moves.length
        ? { san: moves[i + 1], idx: i + 2, cls: blackAnalysis?.classification }
        : undefined,
    });
  }

  // Stats
  const stats = analysis ? countClassifications(analysis) : null;

  return (
    <div>
      {/* Header stats */}
      {stats && (
        <div className="flex gap-2 px-4 py-2 border-b border-border flex-wrap">
          {Object.entries(stats).map(([cls, count]) =>
            count > 0 ? (
              <div key={cls} className="flex items-center gap-1 text-[0.7rem] font-[family-name:var(--font-mono)]">
                <span
                  className="w-[6px] h-[6px] rounded-full"
                  style={{ background: CLASSIFICATION_COLORS[cls as MoveClassification] }}
                />
                <span className="text-text-secondary">{count}</span>
              </div>
            ) : null
          )}
        </div>
      )}
      {/* Move rows */}
      <div className="max-h-[280px] overflow-y-auto p-2">
        {rows.map((row) => (
          <div key={row.number} className="grid grid-cols-[32px_1fr_1fr] gap-0.5 py-px">
            <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-text-muted text-right pr-1.5 py-1 font-medium">
              {row.number}.
            </span>
            <MoveCell
              san={row.white.san}
              classification={row.white.cls}
              isActive={currentMove === row.white.idx}
              onClick={() => onMoveClick(row.white.idx)}
              ref={currentMove === row.white.idx ? activeRef : undefined}
            />
            {row.black != null ? (
              <MoveCell
                san={row.black.san}
                classification={row.black.cls}
                isActive={currentMove === row.black.idx}
                onClick={() => onMoveClick(row.black!.idx)}
                ref={currentMove === row.black.idx ? activeRef : undefined}
              />
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { forwardRef } from 'react';

const MoveCell = forwardRef<
  HTMLButtonElement,
  { san: string; classification?: MoveClassification; isActive: boolean; onClick: () => void }
>(function MoveCell({ san, classification, isActive, onClick }, ref) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-left cursor-pointer
        font-[family-name:var(--font-mono)] text-[0.82rem] transition-all
        ${isActive
          ? 'bg-bg-elevated text-gold font-semibold'
          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
    >
      {classification && (
        <span
          className="w-[7px] h-[7px] rounded-full flex-shrink-0"
          style={{ background: CLASSIFICATION_COLORS[classification] }}
        />
      )}
      {san}
    </button>
  );
});

function countClassifications(analysis: MoveAnalysis[]): Record<MoveClassification, number> {
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
  for (const m of analysis) {
    if (m.classification) counts[m.classification]++;
  }
  return counts;
}
