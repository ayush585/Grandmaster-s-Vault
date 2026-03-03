'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import ChessBoardView from '@/components/ChessBoardView';
import EnginePanel from '@/components/EnginePanel';
import MoveList from '@/components/MoveList';
import EvalChart from '@/components/EvalChart';
import AnalysisReport from '@/components/AnalysisReport';
import UploadModal from '@/components/UploadModal';
import type { UploadData } from '@/components/UploadModal';
import AnalysisProgressModal from '@/components/AnalysisProgressModal';
import AuthModal from '@/components/AuthModal';
import GameLibrary from '@/components/GameLibrary';
import Toast from '@/components/Toast';
import AnalysisSidebar from '@/components/AnalysisSidebar';
import { Chess } from 'chess.js';
import { parseMoves } from '@/lib/pgn-parser';
import { initEngine, analyzeGame, computeAccuracy, stopEngine } from '@/lib/engine';
import type { AnalysisDepth } from '@/lib/engine';
import { saveGame } from '@/lib/storage';
import { shareGame } from '@/lib/sharing';
import { downloadPGN } from '@/lib/pgn-export';
import { signOutUser } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import type { GameData, MoveAnalysis } from '@/types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function HomeContent() {
  const { user, loading: authLoading } = useAuth();

  // View state
  const [currentView, setCurrentView] = useState<'analysis' | 'library'>('analysis');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Game state
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [fens, setFens] = useState<string[]>([START_FEN]);
  const [currentMove, setCurrentMove] = useState(0);
  const [analysis, setAnalysis] = useState<MoveAnalysis[]>([]);
  const [whiteAccuracy, setWhiteAccuracy] = useState(0);
  const [blackAccuracy, setBlackAccuracy] = useState(0);

  // Engine state
  const [engineEval, setEngineEval] = useState(0);
  const [engineMate, setEngineMate] = useState<number | null>(null);
  const [engineDepth, setEngineDepth] = useState(0);
  const [enginePV, setEnginePV] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const cancelRef = useRef({ cancelled: false });

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });

  // Library refresh
  const [libraryRefresh, setLibraryRefresh] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  }, []);

  // Current position info
  const currentFen = fens[currentMove] || START_FEN;
  const lastMove = currentMove > 0 ? getLastMoveSquares(fens[currentMove - 1], moves[currentMove - 1]) : null;

  // Update eval display when navigating
  useEffect(() => {
    if (analysis.length > 0 && currentMove > 0) {
      const moveAnalysis = analysis[currentMove - 1];
      if (moveAnalysis) {
        setEngineEval(moveAnalysis.eval);
        setEngineMate(moveAnalysis.mate);
        setEngineDepth(moveAnalysis.depth);
        setEnginePV(moveAnalysis.pv);
      }
    } else if (currentMove === 0 && analysis.length > 0) {
      setEngineEval(0);
      setEngineMate(null);
    }
  }, [currentMove, analysis]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await signOutUser();
    // Clear game state on sign out
    setGameData(null);
    setMoves([]);
    setFens([START_FEN]);
    setCurrentMove(0);
    setAnalysis([]);
    setCurrentView('analysis');
    showToast('Signed out');
  }, [showToast]);

  // Handle game upload
  const handleUpload = useCallback(async (data: UploadData) => {
    if (!user) return;

    // Cancel any in-progress analysis
    if (isAnalyzing) {
      cancelRef.current.cancelled = true;
      stopEngine();
      setIsAnalyzing(false);
    }

    const result = parseMoves(data.movesText);
    if (!result.success) {
      showToast(result.error || 'Failed to parse moves', 'error');
      return;
    }

    setMoves(result.moves);
    setFens(result.fens);
    setCurrentMove(0);
    setAnalysis([]);
    setEngineEval(0);
    setEngineMate(null);
    setEngineDepth(0);
    setEnginePV('');

    const game: GameData = {
      id: '',
      userId: user.uid,
      whiteName: data.whiteName,
      blackName: data.blackName,
      tournament: data.tournament,
      timeControl: data.timeControl,
      date: data.date,
      result: data.result,
      pgn: result.pgn,
      moves: result.moves,
      fens: result.fens,
      savedAt: '',
    };

      try {
        const { id, cloudSaved } = await saveGame(game, user.uid);
        game.id = id;
        setGameData(game);
        setLibraryRefresh((n) => n + 1);

        let msg = `Game loaded: ${result.moves.length} moves parsed & saved`;
        if (result.warning) {
          msg += ` (Warning: ${result.warning})`;
        }
        if (!cloudSaved) {
          // Notify the user that only local save succeeded
          showToast('Game saved locally; cloud sync failed', 'error');
        }
        showToast(msg);
      } catch (e) {
        console.error('Save failed:', e);
        setGameData(game);
        showToast('Game loaded but save failed', 'error');
      }

    setUploadOpen(false);
    setCurrentView('analysis');
  }, [showToast, isAnalyzing, user]);

  // Handle loading game from library
  const handleLoadFromLibrary = useCallback((game: GameData) => {
    // Cancel any in-progress analysis
    if (isAnalyzing) {
      cancelRef.current.cancelled = true;
      stopEngine();
      setIsAnalyzing(false);
    }

    setGameData(game);
    setMoves(game.moves || []);
    setFens(game.fens || [START_FEN]);
    setCurrentMove(0);

    if (game.analysis) {
      setAnalysis(game.analysis);
      const accuracy = computeAccuracy(game.analysis);
      setWhiteAccuracy(accuracy.white);
      setBlackAccuracy(accuracy.black);
    } else {
      setAnalysis([]);
    }

    setEngineEval(0);
    setEngineMate(null);
    setEngineDepth(0);
    setEnginePV('');
    setCurrentView('analysis');
    showToast('Game loaded from library');
  }, [showToast, isAnalyzing]);

  // Run engine analysis
  const handleAnalyze = useCallback(async (depth: AnalysisDepth = 16) => {
    if (fens.length <= 1 || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStatus('Initializing Stockfish engine...');
    setAnalysisError('');
    cancelRef.current = { cancelled: false };

    try {
      await initEngine();
      setAnalysisStatus('Analyzing positions...');

      const handlePartialResults = async (partialResults: MoveAnalysis[]) => {
        if (gameData && user) {
          try {
            const accuracy = computeAccuracy(partialResults);
            const updated = {
              ...gameData,
              analysis: partialResults,
              whiteAccuracy: accuracy.white,
              blackAccuracy: accuracy.black,
            };
            const { cloudSaved: partialCloudSaved } = await saveGame(updated, user.uid);
            // We don't surface partial save failures to the user to avoid noise
            // but could log if needed.

          } catch {
            // Silent fail for auto-save
          }
        }
      };

      const results = await analyzeGame(
        fens,
        moves,
        depth,
        (progress) => {
          const pct = Math.round((progress.current / progress.total) * 100);
          setAnalysisProgress(pct);
          setAnalysisStatus(`Analyzing move ${Math.min(progress.current, moves.length)} of ${moves.length}...`);
        },
        cancelRef.current,
        handlePartialResults
      );

      if (!cancelRef.current.cancelled) {
        setAnalysis(results);
        const accuracy = computeAccuracy(results);
        setWhiteAccuracy(accuracy.white);
        setBlackAccuracy(accuracy.black);

        if (gameData && user) {
          const updated = { ...gameData, analysis: results, whiteAccuracy: accuracy.white, blackAccuracy: accuracy.black };
          setGameData(updated);
          await saveGame(updated, user.uid);
          setLibraryRefresh((n) => n + 1);
        }

        showToast('Analysis complete');
      }
    } catch (e) {
      console.error('Analysis failed:', e);
      const errorMsg = e instanceof Error ? e.message : 'Analysis failed. Please try again.';
      setAnalysisError(errorMsg);
      return;
    }

    setIsAnalyzing(false);
  }, [fens, moves, gameData, showToast, isAnalyzing, user]);

  const handleCancelAnalysis = useCallback(() => {
    cancelRef.current.cancelled = true;
    stopEngine();
    setIsAnalyzing(false);
    setAnalysisError('');
    showToast('Analysis cancelled');
  }, [showToast]);

  const handleRetryAnalysis = useCallback(() => {
    setAnalysisError('');
    setIsAnalyzing(false);
    handleAnalyze(16);
  }, [handleAnalyze]);

  // PGN Export
  const handleExportPGN = useCallback(() => {
    if (!gameData) return;
    const exportData = {
      ...gameData,
      analysis: analysis.length > 0 ? analysis : gameData.analysis,
      whiteAccuracy: whiteAccuracy || gameData.whiteAccuracy,
      blackAccuracy: blackAccuracy || gameData.blackAccuracy,
    };
    downloadPGN(exportData);
    showToast('PGN exported');
  }, [gameData, analysis, whiteAccuracy, blackAccuracy, showToast]);

  // Share Game
  const handleShare = useCallback(async (): Promise<string | null> => {
    if (!gameData || !user) return null;
    try {
      const url = await shareGame(gameData, user.uid);
      showToast('Game shared! Link copied.');
      return url;
    } catch (e) {
      console.error('Share failed:', e);
      showToast('Failed to share game', 'error');
      return null;
    }
  }, [gameData, user, showToast]);

  // Print Report
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const gameLoaded = moves.length > 0;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="text-center">
          <span className="text-[3rem] text-gold block mb-4" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>♛</span>
          <p className="text-text-tertiary text-[0.9rem]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onUploadClick={() => setUploadOpen(true)}
        user={user}
        onSignInClick={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {!user ? (
        /* Landing/Welcome state when not signed in */
        <main className="flex-1 flex items-center justify-center bg-bg-deep">
          <div className="text-center max-w-[520px] px-6">
            <span className="text-[4rem] text-gold block mb-6" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>♛</span>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-bold text-text-primary mb-3">
              Welcome to Grandmaster&apos;s Vault
            </h2>
            <p className="text-text-secondary text-[1rem] mb-8 leading-relaxed">
              Upload chess games, analyze with Stockfish, and share annotated games with your players.
              Sign in to get started.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="px-8 py-3 rounded-md text-[1rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
                hover:shadow-[0_0_30px_rgba(201,162,39,0.2),0_4px_12px_rgba(201,162,39,0.3)] hover:-translate-y-0.5
                transition-all cursor-pointer"
            >
              Sign In to Get Started
            </button>
          </div>
        </main>
      ) : currentView === 'analysis' ? (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[auto_1fr] min-h-[calc(100vh-60px)]">
          {/* Left: Board */}
          <ChessBoardView
            fen={currentFen}
            currentMove={currentMove}
            totalMoves={moves.length}
            evaluation={engineEval}
            mate={engineMate}
            lastMove={lastMove}
            analysis={analysis}
            whiteName={gameData?.whiteName}
            blackName={gameData?.blackName}
            tournament={gameData?.tournament}
            timeControl={gameData?.timeControl}
            result={gameData?.result}
            date={gameData?.date}
            onNavigate={setCurrentMove}
            onAnalyze={handleAnalyze}
            onExportPGN={gameData ? handleExportPGN : undefined}
            onPrint={analysis.length > 0 ? handlePrint : undefined}
            onShare={analysis.length > 0 ? handleShare : undefined}
            gameLoaded={gameLoaded}
            isAnalyzing={isAnalyzing}
          />

          {/* Right: Analysis Panel */}
          <aside className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-60px)] bg-bg-deep">
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
              <MoveList
                moves={moves}
                analysis={analysis}
                currentMove={currentMove}
                onMoveClick={setCurrentMove}
              />
            </div>

            <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary">
                  Evaluation Graph
                </h3>
              </div>
              <EvalChart
                analysis={analysis}
                currentMove={currentMove}
                onMoveClick={setCurrentMove}
              />
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
          </aside>

{/* Mobile hamburger */}
<button
  onClick={() => setMobileDrawerOpen(true)}
  className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-primary border border-border rounded-md"
  aria-label="Open analysis panel"
>☰</button>

{mobileDrawerOpen && (
  <>
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={() => setMobileDrawerOpen(false)}
    />
    <aside className="fixed right-0 top-0 h-full w-80 bg-bg-deep z-50 p-5 overflow-y-auto">
      <button
        onClick={() => setMobileDrawerOpen(false)}
        className="mb-2 text-text-primary"
        aria-label="Close analysis panel"
      >✕ Close</button>
      <AnalysisSidebar
        engineDepth={engineDepth}
        engineEval={engineEval}
        engineMate={engineMate}
        enginePV={enginePV}
        isAnalyzing={isAnalyzing}
        moves={moves}
        analysis={analysis}
        currentMove={currentMove}
        onNavigate={setCurrentMove}
        whiteAccuracy={whiteAccuracy}
        blackAccuracy={blackAccuracy}
        gameData={gameData}
      />
    </aside>
  </>
)}
        </main>
      ) : (
        <GameLibrary onLoadGame={handleLoadFromLibrary} refreshTrigger={libraryRefresh} userId={user?.uid} />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
      />

      <AnalysisProgressModal
        isOpen={isAnalyzing || !!analysisError}
        progress={analysisProgress}
        statusText={analysisStatus}
        errorText={analysisError || undefined}
        onCancel={handleCancelAnalysis}
        onRetry={analysisError ? handleRetryAnalysis : undefined}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}

function getLastMoveSquares(fenBefore: string, san: string): { from: string; to: string } | null {
  if (!fenBefore || !san) return null;
  try {
    const chess = new Chess(fenBefore);
    const move = chess.move(san);
    if (move) return { from: move.from, to: move.to };
  } catch {
    // ignore
  }
  return null;
}
