import { caseContent as gameContent } from '../data/caseContent';
import type {
  ChapterId,
  GameContent,
  GameSettings,
  GameState,
  PuzzleId,
} from '../types/game';
import { createInitialGameState } from './defaultState';
import { completePuzzleFreeChapter, solvePuzzleProgress } from './chapterProgress';

export type GameAction =
  | { type: 'START_GAME'; now: number }
  | { type: 'SELECT_CHAPTER'; chapterId: ChapterId }
  | { type: 'OPEN_MATERIAL'; materialId: string }
  | { type: 'CLOSE_MATERIAL' }
  | { type: 'SOLVE_PUZZLE'; puzzleId: PuzzleId; value?: unknown }
  | { type: 'COMPLETE_CHAPTER'; chapterId: ChapterId }
  | { type: 'SET_PUZZLE_VALUE'; puzzleId: PuzzleId; value: unknown }
  | { type: 'REVEAL_HINT'; puzzleId: PuzzleId }
  | { type: 'SHOW_PUZZLE_SOLUTION'; puzzleId: PuzzleId }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'TOGGLE_STAR'; materialId: string }
  | { type: 'TOGGLE_THEORY'; materialId: string }
  | { type: 'TICK' }
  | { type: 'SET_SETTINGS'; settings: GameSettings }
  | { type: 'FINISH_GAME'; now: number }
  | { type: 'RESET_GAME'; preserveSettings?: boolean };

const toggleValue = (values: string[], value: string): string[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

export const createGameReducer =
  (content: GameContent = gameContent) =>
  (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'START_GAME':
        return state.hasStarted
          ? state
          : { ...state, hasStarted: true, startedAt: action.now };
      case 'SELECT_CHAPTER':
        return state.unlockedChapterIds.includes(action.chapterId)
          ? { ...state, activeChapterId: action.chapterId, selectedMaterialId: null }
          : state;
      case 'OPEN_MATERIAL':
        if (!state.unlockedMaterialIds.includes(action.materialId)) return state;
        return {
          ...state,
          selectedMaterialId: action.materialId,
          viewedMaterialIds: state.viewedMaterialIds.includes(action.materialId)
            ? state.viewedMaterialIds
            : [...state.viewedMaterialIds, action.materialId],
        };
      case 'CLOSE_MATERIAL':
        return { ...state, selectedMaterialId: null };
      case 'SET_PUZZLE_VALUE':
        return {
          ...state,
          puzzleProgress: {
            ...state.puzzleProgress,
            [action.puzzleId]: {
              ...(state.puzzleProgress[action.puzzleId] ?? {
                solved: false,
                hintsRevealed: 0,
                solutionShown: false,
              }),
              value: action.value,
            },
          },
        };
      case 'SOLVE_PUZZLE': {
        const progressed = solvePuzzleProgress(state, action.puzzleId, content);
        if (action.value === undefined) return progressed;
        return {
          ...progressed,
          puzzleProgress: {
            ...progressed.puzzleProgress,
            [action.puzzleId]: {
              ...(progressed.puzzleProgress[action.puzzleId] ?? {
                solved: true,
                hintsRevealed: 0,
                solutionShown: false,
              }),
              value: action.value,
            },
          },
        };
      }
      case 'COMPLETE_CHAPTER':
        return completePuzzleFreeChapter(state, action.chapterId, content);
      case 'REVEAL_HINT': {
        const progress = state.puzzleProgress[action.puzzleId];
        if (!progress || progress.hintsRevealed >= 3) return state;
        return {
          ...state,
          puzzleProgress: {
            ...state.puzzleProgress,
            [action.puzzleId]: {
              ...progress,
              hintsRevealed: progress.hintsRevealed + 1,
            },
          },
        };
      }
      case 'SHOW_PUZZLE_SOLUTION': {
        const progress = state.puzzleProgress[action.puzzleId];
        if (!progress || progress.hintsRevealed < 3) return state;
        return {
          ...state,
          puzzleProgress: {
            ...state.puzzleProgress,
            [action.puzzleId]: { ...progress, solutionShown: true },
          },
        };
      }
      case 'SET_NOTES':
        return { ...state, notes: action.notes.slice(0, 20_000) };
      case 'TOGGLE_STAR':
        return {
          ...state,
          starredEvidenceIds: toggleValue(state.starredEvidenceIds, action.materialId),
        };
      case 'TOGGLE_THEORY':
        return {
          ...state,
          theoryEvidenceIds: toggleValue(state.theoryEvidenceIds, action.materialId),
        };
      case 'TICK':
        return state.hasStarted && !state.hasFinished
          ? { ...state, elapsedSeconds: state.elapsedSeconds + 1 }
          : state;
      case 'SET_SETTINGS':
        return { ...state, settings: structuredClone(action.settings) };
      case 'FINISH_GAME':
        return state.hasFinished
          ? state
          : { ...state, hasFinished: true, finishedAt: action.now };
      case 'RESET_GAME':
        return createInitialGameState(
          action.preserveSettings === false ? undefined : state.settings,
          content,
        );
    }
  };

export const gameReducer = createGameReducer();
