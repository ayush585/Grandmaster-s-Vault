'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useScout } from '@/contexts/ScoutContext';
import { createPuzzleSession, fetchPuzzlesForTheme, getAvailableThemes, PUZZLE_THEME_LABELS } from '@/lib/puzzle-api';
import { moveToUci, playStrictPuzzleMove } from '@/lib/puzzle-session';

export default function PuzzleTrainer() {
  const { state, dispatch } = useScout();
  const [selectedTheme, setSelectedTheme] = useState('fork');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState<string>('');
  const [lineIndex, setLineIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'active' | 'solved' | 'failed'>('idle');
  const [expectedMove, setExpectedMove] = useState('');
  const [attemptRecorded, setAttemptRecorded] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const session = state.puzzleSession;
  const currentPuzzle = session?.active ? session.puzzles[session.currentIndex] : null;

  const recommendedThemes = useMemo(() => {
    const source = [
      ...(state.selfReport?.suggestedPuzzleThemes || []),
      ...(state.opponentReport?.suggestedPuzzleThemes || []),
    ];
    return Array.from(new Set(source));
  }, [state.selfReport, state.opponentReport]);

  const themeOptions = useMemo(() => {
    const all = getAvailableThemes();
    const ordered = [...recommendedThemes, ...all.filter((t) => !recommendedThemes.includes(t))];
    return Array.from(new Set(ordered));
  }, [recommendedThemes]);

  const initializePuzzle = useCallback(() => {
    if (!currentPuzzle) {
      setPosition('');
      setStatus('idle');
      return;
    }

    setPosition(currentPuzzle.fen);
    setLineIndex(0);
    setStatus('active');
    setExpectedMove('');
    setAttemptRecorded(false);
  }, [currentPuzzle]);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  const recordAttempt = useCallback(
    (result: 'solved' | 'failed' | 'skipped') => {
      if (!session || !currentPuzzle || attemptRecorded) return;
      dispatch({
        type: 'ADD_PUZZLE_ATTEMPT',
        attempt: {
          puzzleId: currentPuzzle.id,
          result,
          theme: session.theme,
        },
      });
      setAttemptRecorded(true);
    },
    [attemptRecorded, currentPuzzle, dispatch, session]
  );

  const handleStartSession = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const puzzles = await fetchPuzzlesForTheme(selectedTheme, 10);
      if (puzzles.length === 0) {
        setError('Could not load playable puzzles for this theme. Try another theme.');
        return;
      }

      dispatch({ type: 'SET_PUZZLE_SESSION', session: createPuzzleSession(selectedTheme, puzzles) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start puzzle session.');
    } finally {
      setLoading(false);
    }
  }, [dispatch, selectedTheme]);

  const handleNextPuzzle = useCallback(() => {
    dispatch({ type: 'NEXT_PUZZLE' });
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    recordAttempt('skipped');
    handleNextPuzzle();
  }, [handleNextPuzzle, recordAttempt]);

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare, piece }: { sourceSquare: string; targetSquare: string | null; piece: { pieceType: string } }) => {
      if (!currentPuzzle || !position || status !== 'active' || !targetSquare) {
        return false;
      }

      try {
        const chess = new Chess(position);
        const pieceType = piece?.pieceType || '';
        const isPawn = pieceType[1] === 'P';
        const promotionRank = pieceType[0] === 'w' ? '8' : '1';
        const promotion = isPawn && targetSquare[1] === promotionRank ? 'q' : undefined;
        const userUci = moveToUci(sourceSquare, targetSquare, promotion);

        const result = playStrictPuzzleMove(chess, currentPuzzle.moves, lineIndex, userUci);
        if (!result.ok) {
          setStatus('failed');
          setExpectedMove(result.expectedMove || '');
          recordAttempt('failed');
          return false;
        }

        setPosition(chess.fen());
        setLineIndex(result.nextIndex);

        if (result.status === 'solved') {
          setStatus('solved');
          recordAttempt('solved');
        }

        return true;
      } catch {
        return false;
      }
    },
    [currentPuzzle, lineIndex, position, recordAttempt, status]
  );

  const solvedCount = session?.attempts.filter((a) => a.result === 'solved').length || 0;
  const failedCount = session?.attempts.filter((a) => a.result === 'failed').length || 0;
  const skippedCount = session?.attempts.filter((a) => a.result === 'skipped').length || 0;

  return (
    <div className="space-y-4">
      <div className="bg-bg-primary border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary">
            Puzzle Trainer
          </h3>
          <div className="text-[0.75rem] text-text-muted">
            Strict line mode: wrong move fails the puzzle.
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[0.75rem] text-text-secondary mb-2">Recommended themes</p>
          <div className="flex flex-wrap gap-1.5">
            {recommendedThemes.length === 0 && <span className="text-[0.75rem] text-text-muted">No recommendations yet.</span>}
            {recommendedThemes.map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-2.5 py-1 rounded-md text-[0.72rem] border transition-all cursor-pointer
                  ${selectedTheme === theme
                    ? 'bg-bg-tertiary text-gold border-gold/35'
                    : 'bg-bg-secondary text-text-secondary border-border hover:text-text-primary'}`}
              >
                {PUZZLE_THEME_LABELS[theme] || theme}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="h-9 px-3 border border-border bg-bg-secondary text-text-secondary text-[0.78rem] rounded-md outline-none cursor-pointer"
          >
            {themeOptions.map((theme) => (
              <option key={theme} value={theme}>
                {PUZZLE_THEME_LABELS[theme] || theme}
              </option>
            ))}
          </select>

          <button
            onClick={handleStartSession}
            disabled={loading}
            className="px-4 h-9 rounded-md text-[0.8rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
              hover:shadow-[0_0_16px_rgba(201,162,39,0.18)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? 'Loading...' : 'Start Session'}
          </button>
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 rounded border border-[rgba(224,85,85,0.3)] bg-[rgba(224,85,85,0.1)] text-[0.78rem] text-blunder">
            {error}
          </div>
        )}
      </div>

      {session && !session.active && (
        <div className="bg-bg-primary border border-border rounded-lg p-4">
          <h4 className="font-[family-name:var(--font-display)] text-[1rem] font-semibold text-text-primary mb-2">Session Complete</h4>
          <p className="text-[0.82rem] text-text-secondary mb-3">
            Solved {solvedCount}, failed {failedCount}, skipped {skippedCount}.
          </p>
          <button
            onClick={handleStartSession}
            className="px-4 py-2 rounded-md text-[0.78rem] font-semibold border border-border text-text-secondary hover:text-text-primary hover:border-border-accent transition-all cursor-pointer"
          >
            Start New Session
          </button>
        </div>
      )}

      {currentPuzzle && session?.active && (
        <div className="bg-bg-primary border border-border rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-[0.75rem] text-text-muted">Puzzle {session.currentIndex + 1}/{session.puzzles.length}</p>
              <p className="text-[0.78rem] text-text-secondary">Theme: {PUZZLE_THEME_LABELS[session.theme] || session.theme}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.75rem] text-text-muted">Rating {currentPuzzle.rating}</span>
              <button
                onClick={() => setFlipped((f) => !f)}
                className="w-8 h-8 border border-border rounded-md text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                title="Flip board"
              >
                F
              </button>
            </div>
          </div>

          <div className="w-full max-w-[420px] mx-auto aspect-square mb-3">
            <Chessboard
              options={{
                id: 'puzzle-trainer-board',
                position,
                boardOrientation: flipped ? 'black' : 'white',
                allowDragging: status === 'active',
                onPieceDrop: handlePieceDrop,
                darkSquareStyle: { backgroundColor: '#b08762' },
                lightSquareStyle: { backgroundColor: '#edd6ae' },
                boardStyle: {
                  borderRadius: '2px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(201, 162, 39, 0.3)',
                },
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <a
              href={currentPuzzle.url}
              target="_blank"
              rel="noreferrer"
              className="text-[0.75rem] text-gold hover:underline"
            >
              Open on Lichess
            </a>

            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 rounded border border-border text-[0.72rem] text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={handleNextPuzzle}
                className="px-3 py-1.5 rounded border border-border text-[0.72rem] text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                Next Puzzle
              </button>
            </div>
          </div>

          {status === 'solved' && (
            <div className="mt-3 px-3 py-2 rounded border border-[rgba(123,201,106,0.35)] bg-[rgba(123,201,106,0.1)] text-[0.78rem] text-best">
              Correct line solved.
            </div>
          )}

          {status === 'failed' && (
            <div className="mt-3 px-3 py-2 rounded border border-[rgba(224,85,85,0.35)] bg-[rgba(224,85,85,0.1)] text-[0.78rem] text-blunder">
              Wrong move. Expected <span className="font-[family-name:var(--font-mono)]">{expectedMove || 'the line move'}</span>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
