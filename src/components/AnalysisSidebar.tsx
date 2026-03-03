'use client';

import EnginePanel from './EnginePanel';
import MoveList from './MoveList';
import EvalChart from './EvalChart';
import AnalysisReport from './AnalysisReport';
import type { MoveAnalysis, GameData } from '@/types';

interface AnalysisSidebarProps {
  engineDepth: number;
  engineEval: number;
  engineMate: number | null;
  enginePV: string;
  isAnalyzing: boolean;
  moves: string[];
  analysis: MoveAnalysis[];
  currentMove: number;
  onNavigate: (move: number) => void;
  whiteAccuracy: number;
  blackAccuracy: number;
  gameData?: GameData | null;
}

export default function AnalysisSidebar({
  engineDepth,
  engineEval,
  engineMate,
  enginePV,
  isAnalyzing,
  moves,
  analysis,
  currentMove,
  onNavigate,
  whiteAccuracy,
  blackAccuracy,
  gameData,
}: AnalysisSidebarProps) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-60px)] bg-bg-deep">
      <EnginePanel
        depth={engineDepth}
        evaluation={engineEval}
        mate={engineMate}
        pvLine={enginePV}
        isAnalyzing={isAnalyzing}
      />

      <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary">
            Moves
          </h3>
        </div>
        <MoveList moves={moves} analysis={analysis} currentMove={currentMove} onMoveClick={onNavigate} />
      </div>

      <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary">
            Evaluation Graph
          </h3>
        </div>
        <EvalChart analysis={analysis} currentMove={currentMove} onMoveClick={onNavigate} />
      </div>

      {analysis.length > 0 && (
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary">
              Analysis Report
            </h3>
          </div>
          <AnalysisReport
            analysis={analysis}
            whiteAccuracy={whiteAccuracy}
            blackAccuracy={blackAccuracy}
            whiteName={gameData?.whiteName || 'White'}
            blackName={gameData?.blackName || 'Black'}
          />
        </div>
      )}
    </div>
  );
}
