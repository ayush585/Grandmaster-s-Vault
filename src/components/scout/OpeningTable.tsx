'use client';

import { useState } from 'react';
import type { OpeningStats } from '@/types';

interface Props {
  openingStats: OpeningStats[];
}

type SortKey = 'games' | 'wins' | 'avgAccuracy' | 'name';

export default function OpeningTable({ openingStats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('games');
  const [sortAsc, setSortAsc] = useState(false);

  if (openingStats.length === 0) return null;

  const sorted = [...openingStats].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortKey === 'wins') {
      cmp = (a.games > 0 ? a.wins / a.games : 0) - (b.games > 0 ? b.wins / b.games : 0);
    } else {
      cmp = (a[sortKey] as number) - (b[sortKey] as number);
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <span className={`text-[0.65rem] ml-0.5 ${active ? 'text-gold' : 'text-text-muted'}`}>
      {active ? (asc ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
    <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
      <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary px-4 py-3 border-b border-border">
        Opening Repertoire
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.8rem]">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="text-left px-4 py-2 font-medium cursor-pointer hover:text-gold" onClick={() => handleSort('name')}>
                Opening <SortIcon active={sortKey === 'name'} asc={sortAsc} />
              </th>
              <th className="text-center px-3 py-2 font-medium cursor-pointer hover:text-gold" onClick={() => handleSort('games')}>
                Games <SortIcon active={sortKey === 'games'} asc={sortAsc} />
              </th>
              <th className="text-center px-3 py-2 font-medium cursor-pointer hover:text-gold" onClick={() => handleSort('wins')}>
                Win% <SortIcon active={sortKey === 'wins'} asc={sortAsc} />
              </th>
              <th className="text-center px-3 py-2 font-medium cursor-pointer hover:text-gold" onClick={() => handleSort('avgAccuracy')}>
                Accuracy <SortIcon active={sortKey === 'avgAccuracy'} asc={sortAsc} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 15).map((op) => {
              const winPct = op.games > 0 ? Math.round((op.wins / op.games) * 100) : 0;
              return (
                <tr key={op.name} className="border-b border-border/50 hover:bg-bg-secondary/50">
                  <td className="px-4 py-2.5 text-text-primary">
                    <span className="text-text-muted font-mono text-[0.7rem] mr-2">{op.eco}</span>
                    {op.name}
                  </td>
                  <td className="text-center px-3 py-2.5 text-text-secondary">{op.games}</td>
                  <td className="text-center px-3 py-2.5">
                    <span className={winPct >= 60 ? 'text-best' : winPct >= 40 ? 'text-text-secondary' : 'text-blunder'}>
                      {winPct}%
                    </span>
                    <span className="text-text-muted text-[0.7rem] ml-1">
                      ({op.wins}W/{op.draws}D/{op.losses}L)
                    </span>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className={op.avgAccuracy >= 80 ? 'text-best' : op.avgAccuracy >= 60 ? 'text-inaccuracy' : 'text-blunder'}>
                      {op.avgAccuracy}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
