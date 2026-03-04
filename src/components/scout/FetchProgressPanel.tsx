'use client';

import { useScout } from '@/contexts/ScoutContext';

const PHASE_STEPS = [
  { key: 'fetching', label: 'Fetching Games' },
  { key: 'analyzing', label: 'Analyzing' },
  { key: 'done', label: 'Complete' },
] as const;

export default function FetchProgressPanel() {
  const { state } = useScout();
  const progress = state.batchProgress;

  if (!progress) return null;

  const isError = progress.phase === 'error';
  const isCancelled = progress.phase === 'cancelled';
  const isDone = progress.phase === 'done';

  // Overall progress percentage
  const totalGames = progress.totalGames || 1;
  const gameProgress = progress.currentGameMoveProgress || 0;
  const overallPct = isDone
    ? 100
    : Math.round(((progress.currentGame - 1) / totalGames) * 100 + gameProgress / totalGames);

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-5 mb-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-4">
        {PHASE_STEPS.map((step, i) => {
          const isActive =
            step.key === progress.phase ||
            (step.key === 'analyzing' && progress.phase === 'parsing');
          const isPast =
            (step.key === 'fetching' && ['analyzing', 'done'].includes(progress.phase)) ||
            (step.key === 'analyzing' && progress.phase === 'done');

          return (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-8 h-0.5 ${isPast || isActive ? 'bg-gold' : 'bg-border'}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-bold
                    ${isPast ? 'bg-gold text-bg-deep' : isActive ? 'bg-gold/20 text-gold border border-gold' : 'bg-bg-secondary text-text-muted border border-border'}`}
                >
                  {isPast ? '✓' : i + 1}
                </div>
                <span className={`text-[0.75rem] font-medium ${isActive ? 'text-gold' : isPast ? 'text-text-primary' : 'text-text-muted'}`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {!isDone && !isError && !isCancelled && (
        <div className="mb-3">
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-dim to-gold rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, overallPct)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-text-muted text-[0.7rem]">
              {progress.phase === 'analyzing'
                ? `Game ${progress.currentGame}/${progress.totalGames}`
                : 'Fetching...'}
            </span>
            <span className="text-text-muted text-[0.7rem]">{overallPct}%</span>
          </div>
        </div>
      )}

      {/* Status message */}
      <p className={`text-[0.85rem] ${isError ? 'text-blunder' : isCancelled ? 'text-text-muted' : isDone ? 'text-best' : 'text-text-secondary'}`}>
        {progress.message}
      </p>
    </div>
  );
}
