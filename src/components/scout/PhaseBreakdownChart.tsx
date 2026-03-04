'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PhaseStats } from '@/types';

interface Props {
  phaseStats: PhaseStats[];
}

const PHASE_COLORS: Record<string, string> = {
  opening: '#5c9fe6',
  middlegame: '#e8c63a',
  endgame: '#7bc96a',
};

const PHASE_LABELS: Record<string, string> = {
  opening: 'Opening',
  middlegame: 'Middlegame',
  endgame: 'Endgame',
};

export default function PhaseBreakdownChart({ phaseStats }: Props) {
  const data = phaseStats.map((ps) => ({
    phase: PHASE_LABELS[ps.phase] || ps.phase,
    accuracy: ps.avgAccuracy,
    blunders: ps.blunders,
    mistakes: ps.mistakes,
    color: PHASE_COLORS[ps.phase] || '#9994a8',
  }));

  if (data.length === 0) return null;

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-4">
      <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary mb-3">
        Accuracy by Game Phase
      </h4>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,102,121,0.2)" />
            <XAxis dataKey="phase" tick={{ fill: '#9994a8', fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#9994a8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a23',
                border: '1px solid rgba(107,102,121,0.3)',
                borderRadius: '6px',
                fontSize: '0.8rem',
              }}
              labelStyle={{ color: '#e8e5df' }}
              formatter={(value: number | string | undefined) => [`${Number(value ?? 0)}%`, 'Accuracy']}
            />
            <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        {phaseStats.map((ps) => (
          <div key={ps.phase} className="text-center">
            <div className="text-[0.7rem] text-text-muted uppercase tracking-wider">{PHASE_LABELS[ps.phase]}</div>
            <div className="text-[1.1rem] font-bold" style={{ color: PHASE_COLORS[ps.phase] }}>
              {ps.avgAccuracy}%
            </div>
            <div className="text-[0.7rem] text-text-tertiary">
              {ps.totalMoves} moves | {ps.blunders} blunders
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
