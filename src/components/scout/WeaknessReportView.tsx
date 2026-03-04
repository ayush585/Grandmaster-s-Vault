'use client';

import type { WeaknessReport } from '@/types';
import PhaseBreakdownChart from './PhaseBreakdownChart';
import OpeningTable from './OpeningTable';
import BlunderPatternList from './BlunderPatternList';

interface WeaknessReportViewProps {
  report: WeaknessReport;
  onBack: () => void;
  onPractice: (themes: string[]) => void;
}

function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WeaknessReportView({ report, onBack, onPractice }: WeaknessReportViewProps) {
  const totalClassified = Object.values(report.classificationDistribution).reduce((a, b) => a + b, 0);
  const topThemes = report.suggestedPuzzleThemes.slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="bg-bg-primary border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-md border border-border text-[0.75rem] text-text-secondary hover:text-text-primary hover:border-border-accent transition-all cursor-pointer"
          >
            Back
          </button>
          <div className="text-right">
            <h3 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold text-text-primary">
              Weakness Report: {report.username}
            </h3>
            <p className="text-[0.75rem] text-text-muted">
              {report.platform === 'vault' ? 'Source: Grandmaster\'s Vault Library' : `Source: ${report.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}`}
            </p>
          </div>
        </div>

        {report.warningSummary && (
          <div className="mt-3 px-3 py-2 rounded border border-[rgba(232,198,58,0.35)] bg-[rgba(232,198,58,0.1)] text-[0.78rem] text-inaccuracy">
            {report.warningSummary.message}
            <span className="text-text-secondary ml-2">
              ({report.warningSummary.analyzed}/{report.warningSummary.fetched} analyzed)
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-bg-secondary rounded-md p-3">
            <div className="text-[0.7rem] uppercase tracking-wider text-text-muted mb-1">Overall Accuracy</div>
            <div className="text-[1.5rem] font-bold text-gold">{report.overallAccuracy}%</div>
          </div>
          <div className="bg-bg-secondary rounded-md p-3">
            <div className="text-[0.7rem] uppercase tracking-wider text-text-muted mb-1">Games Analyzed</div>
            <div className="text-[1.5rem] font-bold text-text-primary">{report.gamesAnalyzed}</div>
          </div>
          <div className="bg-bg-secondary rounded-md p-3">
            <div className="text-[0.7rem] uppercase tracking-wider text-text-muted mb-1">Classified Moves</div>
            <div className="text-[1.5rem] font-bold text-text-primary">{totalClassified}</div>
          </div>
        </div>
      </div>

      <PhaseBreakdownChart phaseStats={report.phaseStats} />
      <OpeningTable openingStats={report.openingStats} />
      <BlunderPatternList patterns={report.blunderPatterns} />

      <div className="bg-bg-primary border border-border rounded-lg p-4">
        <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary mb-3">
          Top Weakness Signals
        </h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {report.weaknesses.length === 0 && (
            <span className="text-[0.8rem] text-text-muted">No strong recurring weakness signal found yet.</span>
          )}
          {report.weaknesses.map((w) => (
            <span key={w} className="px-2.5 py-1 rounded-full bg-bg-secondary border border-border text-[0.75rem] text-text-secondary">
              {titleCase(w)}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h5 className="text-[0.82rem] font-semibold text-text-primary mb-1">Recommended Puzzle Themes</h5>
            <div className="flex flex-wrap gap-1.5">
              {topThemes.map((theme) => (
                <span key={theme} className="px-2 py-1 rounded bg-bg-secondary text-[0.72rem] text-text-secondary border border-border">
                  {titleCase(theme)}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => onPractice(report.suggestedPuzzleThemes)}
            className="px-4 py-2 rounded-md text-[0.8rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright hover:shadow-[0_0_16px_rgba(201,162,39,0.18)] transition-all cursor-pointer"
          >
            Practice Themes
          </button>
        </div>
      </div>

      <div className="bg-bg-primary border border-border rounded-lg p-4">
        <h4 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-text-primary mb-3">
          Move Classification Distribution
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(report.classificationDistribution).map(([name, count]) => (
            <div key={name} className="bg-bg-secondary rounded-md p-2.5 text-center">
              <div className="text-[0.68rem] text-text-muted uppercase tracking-wider">{name}</div>
              <div className="text-[1.05rem] font-bold text-text-primary">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
