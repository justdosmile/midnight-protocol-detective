import type { ChapterId, GameContent, GameState, PuzzleId } from '../types/game';

const unique = <T>(values: T[]): T[] => [...new Set(values)];

export const isChapterUnlocked = (state: GameState, chapterId: ChapterId): boolean =>
  state.unlockedChapterIds.includes(chapterId);

export const getNextChapterId = (
  content: GameContent,
  currentChapterId: ChapterId,
): ChapterId | null => {
  const chapterIndex = content.chapters.findIndex((chapter) => chapter.id === currentChapterId);
  return content.chapters[chapterIndex + 1]?.id ?? null;
};

export const solvePuzzleProgress = (
  state: GameState,
  puzzleId: PuzzleId,
  content: GameContent,
): GameState => {
  const puzzle = content.puzzles.find((item) => item.id === puzzleId);
  if (!puzzle || state.puzzleProgress[puzzleId]?.solved) return state;

  const nextChapterId = getNextChapterId(content, puzzle.chapterId);
  const nextChapter = content.chapters.find((chapter) => chapter.id === nextChapterId);
  const nextPuzzles = content.puzzles.filter((item) => item.chapterId === nextChapterId);
  const hiddenInNextChapter = new Set(nextPuzzles.flatMap((item) => item.unlockMaterialIds));
  const nextMaterialIds =
    nextChapter?.materialIds.filter((id) => !hiddenInNextChapter.has(id)) ?? [];

  const allChapterPuzzlesSolved = content.puzzles
    .filter((item) => item.chapterId === puzzle.chapterId)
    .every((item) => item.id === puzzleId || state.puzzleProgress[item.id]?.solved);

  return {
    ...state,
    puzzleProgress: {
      ...state.puzzleProgress,
      [puzzleId]: {
        ...(state.puzzleProgress[puzzleId] ?? {
          solved: false,
          hintsRevealed: 0,
          solutionShown: false,
        }),
        solved: true,
      },
    },
    unlockedChapterIds: nextChapterId && allChapterPuzzlesSolved
      ? unique([...state.unlockedChapterIds, nextChapterId])
      : state.unlockedChapterIds,
    unlockedMaterialIds: unique([
      ...state.unlockedMaterialIds,
      ...puzzle.unlockMaterialIds,
      ...(allChapterPuzzlesSolved ? nextMaterialIds : []),
    ]),
  };
};

export const requiredMaterialsViewed = (
  state: GameState,
  materialIds: readonly string[],
): boolean => materialIds.every((id) => state.viewedMaterialIds.includes(id));

export const completePuzzleFreeChapter = (
  state: GameState,
  chapterId: ChapterId,
  content: GameContent,
): GameState => {
  if (content.puzzles.some((puzzle) => puzzle.chapterId === chapterId)) return state;
  const chapter = content.chapters.find((item) => item.id === chapterId);
  if (!chapter || !requiredMaterialsViewed(state, chapter.materialIds)) return state;

  const nextChapterId = getNextChapterId(content, chapterId);
  const nextChapter = content.chapters.find((item) => item.id === nextChapterId);
  if (!nextChapterId || !nextChapter) return state;
  const hidden = new Set(
    content.puzzles
      .filter((puzzle) => puzzle.chapterId === nextChapterId)
      .flatMap((puzzle) => puzzle.unlockMaterialIds),
  );

  return {
    ...state,
    unlockedChapterIds: unique([...state.unlockedChapterIds, nextChapterId]),
    unlockedMaterialIds: unique([
      ...state.unlockedMaterialIds,
      ...nextChapter.materialIds.filter((id) => !hidden.has(id)),
    ]),
  };
};
