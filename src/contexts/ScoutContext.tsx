'use client';

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type {
  ScoutState,
  ScoutSubTab,
  FetchedGame,
  BatchAnalysisProgress,
  WeaknessReport,
  PuzzleSession,
  PuzzleAttempt,
  ScoutWarningSummary,
} from '@/types';

export type ScoutAction =
  | { type: 'SET_TAB'; tab: ScoutSubTab }
  | { type: 'SET_FETCHING'; isFetching: boolean }
  | { type: 'SET_FETCHED_GAMES'; games: FetchedGame[] }
  | { type: 'SET_BATCH_PROGRESS'; progress: BatchAnalysisProgress | null }
  | { type: 'SET_ANALYZING_BATCH'; isAnalyzing: boolean }
  | { type: 'UPDATE_GAME_ANALYSIS'; index: number; game: FetchedGame }
  | { type: 'SET_OPPONENT_REPORT'; report: WeaknessReport | null }
  | { type: 'SET_SELF_REPORT'; report: WeaknessReport | null }
  | { type: 'SET_OPPONENT_WARNING'; warning: ScoutWarningSummary | null }
  | { type: 'SET_SELF_WARNING'; warning: ScoutWarningSummary | null }
  | { type: 'SET_PREFERRED_PUZZLE_THEMES'; themes: string[] }
  | { type: 'SET_PUZZLE_SESSION'; session: PuzzleSession | null }
  | { type: 'ADD_PUZZLE_ATTEMPT'; attempt: PuzzleAttempt }
  | { type: 'NEXT_PUZZLE' }
  | { type: 'RESET' };

export const initialScoutState: ScoutState = {
  activeTab: 'opponent',
  fetchedGames: [],
  isFetching: false,
  batchProgress: null,
  isAnalyzingBatch: false,
  opponentReport: null,
  selfReport: null,
  opponentWarning: null,
  selfWarning: null,
  preferredPuzzleThemes: [],
  puzzleSession: null,
};

export function scoutReducer(state: ScoutState, action: ScoutAction): ScoutState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_FETCHING':
      return { ...state, isFetching: action.isFetching };
    case 'SET_FETCHED_GAMES':
      return { ...state, fetchedGames: action.games };
    case 'SET_BATCH_PROGRESS':
      return { ...state, batchProgress: action.progress };
    case 'SET_ANALYZING_BATCH':
      return { ...state, isAnalyzingBatch: action.isAnalyzing };
    case 'UPDATE_GAME_ANALYSIS': {
      const games = [...state.fetchedGames];
      games[action.index] = action.game;
      return { ...state, fetchedGames: games };
    }
    case 'SET_OPPONENT_REPORT':
      return { ...state, opponentReport: action.report };
    case 'SET_SELF_REPORT':
      return { ...state, selfReport: action.report };
    case 'SET_OPPONENT_WARNING':
      return { ...state, opponentWarning: action.warning };
    case 'SET_SELF_WARNING':
      return { ...state, selfWarning: action.warning };
    case 'SET_PREFERRED_PUZZLE_THEMES':
      return { ...state, preferredPuzzleThemes: action.themes };
    case 'SET_PUZZLE_SESSION':
      return { ...state, puzzleSession: action.session };
    case 'ADD_PUZZLE_ATTEMPT': {
      if (!state.puzzleSession) return state;
      return {
        ...state,
        puzzleSession: {
          ...state.puzzleSession,
          attempts: [...state.puzzleSession.attempts, action.attempt],
        },
      };
    }
    case 'NEXT_PUZZLE': {
      if (!state.puzzleSession) return state;
      const nextIndex = state.puzzleSession.currentIndex + 1;
      return {
        ...state,
        puzzleSession: {
          ...state.puzzleSession,
          currentIndex: nextIndex,
          active: nextIndex < state.puzzleSession.puzzles.length,
        },
      };
    }
    case 'RESET':
      return initialScoutState;
    default:
      return state;
  }
}

const ScoutContext = createContext<{ state: ScoutState; dispatch: Dispatch<ScoutAction> }>({
  state: initialScoutState,
  dispatch: () => undefined,
});

export function ScoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scoutReducer, initialScoutState);
  return <ScoutContext.Provider value={{ state, dispatch }}>{children}</ScoutContext.Provider>;
}

export function useScout() {
  return useContext(ScoutContext);
}
