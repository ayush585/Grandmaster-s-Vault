'use client';

import { useEffect, type ReactNode } from 'react';
import { useScout } from '@/contexts/ScoutContext';
import type { ScoutSubTab } from '@/types';
import OpponentScoutForm from './OpponentScoutForm';
import SelfAnalysisView from './SelfAnalysisView';
import PuzzleTrainer from './PuzzleTrainer';
import WeaknessReportView from './WeaknessReportView';
import FetchProgressPanel from './FetchProgressPanel';
import { cleanupExpiredCache } from '@/lib/scouting-storage';

const TABS: { key: ScoutSubTab; label: string; icon: ReactNode }[] = [
  {
    key: 'opponent',
    label: 'Opponent Scout',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="11" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 8c2.5 0 4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'self',
    label: 'My Weaknesses',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'puzzles',
    label: 'Practice Puzzles',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 2h4v2.5c0 .5.5 1 1 1h2v8.5H3V2h3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function ScoutView() {
  const { state, dispatch } = useScout();

  useEffect(() => {
    cleanupExpiredCache().catch(() => {
      // best-effort cleanup
    });
  }, []);

  return (
    <main className="flex-1 bg-bg-deep min-h-[calc(100vh-60px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-[1.6rem] font-bold text-text-primary flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Scouting Lab
          </h2>
          <p className="text-text-secondary text-[0.85rem] mt-1">
            Analyze opponents, identify your weaknesses, and practice targeted puzzles.
          </p>
        </div>

        <div className="flex gap-1 bg-bg-primary border border-border rounded-lg p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => dispatch({ type: 'SET_TAB', tab: tab.key })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-[0.85rem] font-medium transition-all flex-1 justify-center cursor-pointer
                ${state.activeTab === tab.key
                  ? 'bg-bg-tertiary text-gold shadow-sm'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'}`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {(state.isFetching || state.isAnalyzingBatch) && state.batchProgress && <FetchProgressPanel />}

        {state.activeTab === 'opponent' && (
          <>
            {state.opponentReport ? (
              <WeaknessReportView
                report={state.opponentReport}
                onBack={() => dispatch({ type: 'SET_OPPONENT_REPORT', report: null })}
                onPractice={(_themes: string[]) => {
                  dispatch({ type: 'SET_TAB', tab: 'puzzles' });
                }}
              />
            ) : (
              <OpponentScoutForm />
            )}
          </>
        )}

        {state.activeTab === 'self' && (
          <>
            {state.selfReport ? (
              <WeaknessReportView
                report={state.selfReport}
                onBack={() => dispatch({ type: 'SET_SELF_REPORT', report: null })}
                onPractice={(_themes: string[]) => {
                  dispatch({ type: 'SET_TAB', tab: 'puzzles' });
                }}
              />
            ) : (
              <SelfAnalysisView />
            )}
          </>
        )}

        {state.activeTab === 'puzzles' && <PuzzleTrainer />}
      </div>
    </main>
  );
}
