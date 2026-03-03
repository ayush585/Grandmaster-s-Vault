'use client';

import { useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { MoveAnalysis } from '@/types';
import { CLASSIFICATION_COLORS } from '@/types';

interface EvalChartProps {
  analysis: MoveAnalysis[];
  currentMove: number;
  onMoveClick: (moveIndex: number) => void;
}

export default function EvalChart({ analysis, currentMove, onMoveClick }: EvalChartProps) {
  const data = useMemo(() => {
    return analysis.map((m, i) => ({
      move: Math.ceil((i + 1) / 2),
      ply: i + 1,
      eval: Math.max(-8, Math.min(8, m.eval)),
      rawEval: m.eval,
      san: m.san,
      classification: m.classification,
      isWhite: m.isWhiteMove,
    }));
  }, [analysis]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback(
    (state: any) => {
      if (state?.activeTooltipIndex != null && typeof state.activeTooltipIndex === 'number') {
        onMoveClick(state.activeTooltipIndex + 1);
      }
    },
    [onMoveClick]
  );

  if (analysis.length === 0) {
    return (
      <div className="p-4 h-[160px] flex items-center justify-center text-text-tertiary text-[0.8rem]">
        Run analysis to see evaluation graph
      </div>
    );
  }

  return (
    <div className="p-3 pb-4">
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={data}
          onClick={handleClick}
          margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="evalGradientPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8e5df" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#e8e5df" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="evalGradientNeg" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#555" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#555" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="ply"
            tick={{ fontSize: 10, fill: '#6b6679' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            tickFormatter={(v: number) => (v % 2 === 1 ? String(Math.ceil(v / 2)) : '')}
          />
          <YAxis
            domain={[-8, 8]}
            tick={{ fontSize: 10, fill: '#6b6679' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            tickFormatter={(v: number) => (v > 0 ? `+${v}` : String(v))}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const d = payload[0].payload;
                const cls = d.classification;
                return (
                  <div className="bg-bg-elevated border border-border rounded-md px-3 py-2 shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {cls && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: (CLASSIFICATION_COLORS as Record<string, string>)[cls] }}
                        />
                      )}
                      <span className="font-[family-name:var(--font-mono)] text-[0.8rem] text-text-primary font-medium">
                        {d.isWhite ? `${d.move}. ` : `${d.move}... `}{d.san}
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-mono)] text-[0.75rem] text-text-secondary">
                      Eval: {d.rawEval > 0 ? '+' : ''}{d.rawEval.toFixed(2)}
                    </span>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          {currentMove > 0 && currentMove <= data.length && (
            <ReferenceLine
              x={currentMove}
              stroke="rgba(201, 162, 39, 0.5)"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          )}
          <Area
            type="monotone"
            dataKey="eval"
            stroke="#c9a227"
            strokeWidth={1.5}
            fill="url(#evalGradientPos)"
            fillOpacity={1}
            dot={false}
            activeDot={{
              r: 4,
              stroke: '#c9a227',
              strokeWidth: 2,
              fill: '#0c0c10',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
