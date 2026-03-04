'use client';

import type { BlunderPattern } from '@/types';

interface Props {
  patterns: BlunderPattern[];
}

export default function BlunderPatternList({ patterns }: Props) {
  if (patterns.length === 0) return null;

  return (
    <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
      <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary px-4 py-3 border-b border-border">
        Recurring Blunder Patterns
      </h4>
      <div className="divide-y divide-border/50">
        {patterns.map((pattern) => (
          <div key={pattern.type} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-primary font-medium text-[0.85rem]">{pattern.label}</span>
              <span className="text-blunder font-bold text-[0.85rem]">{pattern.count}x</span>
            </div>
            {pattern.examples.length > 0 && (
              <div className="space-y-1.5">
                {pattern.examples.slice(0, 3).map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 text-[0.75rem] text-text-secondary bg-bg-secondary/50 rounded px-3 py-1.5">
                    <span className="text-blunder font-mono">{ex.move}</span>
                    <span className="text-text-muted">→ best was</span>
                    <span className="text-best font-mono">{ex.bestMove}</span>
                    <span className="text-text-muted ml-auto">-{Math.round(ex.cpLoss)}cp</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
