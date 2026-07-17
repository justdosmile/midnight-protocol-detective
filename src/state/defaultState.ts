import { caseContent as gameContent } from '../data/caseContent';
import type { GameContent, GameSettings, GameState, PuzzleId, PuzzleProgress } from '../types/game';

export const CURRENT_SAVE_VERSION = 4;

export const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    enabled: false,
    volume: 0.28,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
  },
};

const createPuzzleProgress = (content: GameContent): Record<PuzzleId, PuzzleProgress> => {
  const entries = content.puzzles.map(
    (puzzle) =>
      [
        puzzle.id,
        {
          solved: false,
          hintsRevealed: 0,
          solutionShown: false,
        },
      ] as const,
  );
  return Object.fromEntries(entries);
};

export const createInitialGameState = (
  settings: GameSettings = DEFAULT_SETTINGS,
  content: GameContent = gameContent,
): GameState => {
  const firstChapter = content.chapters[0];
  if (!firstChapter) throw new Error('В деле должна существовать хотя бы одна глава.');

  const firstPuzzles = content.puzzles.filter((puzzle) => puzzle.chapterId === firstChapter.id);
  const hiddenUntilSolved = new Set(firstPuzzles.flatMap((puzzle) => puzzle.unlockMaterialIds));

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    hasStarted: false,
    hasFinished: false,
    activeChapterId: firstChapter.id,
    selectedMaterialId: null,
    viewedMaterialIds: [],
    unlockedChapterIds: [firstChapter.id],
    unlockedMaterialIds: firstChapter.materialIds.filter((id) => !hiddenUntilSolved.has(id)),
    puzzleProgress: createPuzzleProgress(content),
    notes: '',
    starredEvidenceIds: [],
    theoryEvidenceIds: [],
    elapsedSeconds: 0,
    startedAt: null,
    finishedAt: null,
    settings: structuredClone(settings),
  };
};
