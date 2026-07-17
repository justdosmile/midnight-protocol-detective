import type { GameContent, GameState, Material, PuzzleId } from '../types/game';

export const selectActiveChapter = (state: GameState, content: GameContent) =>
  content.chapters.find((chapter) => chapter.id === state.activeChapterId) ?? content.chapters[0];

export const selectSelectedMaterial = (
  state: GameState,
  content: GameContent,
): Material | null =>
  content.materials.find((material) => material.id === state.selectedMaterialId) ?? null;

export const selectUnlockedMaterials = (state: GameState, content: GameContent): Material[] => {
  const unlocked = new Set(state.unlockedMaterialIds);
  return content.materials.filter((material) => unlocked.has(material.id));
};

export const selectHintsUsed = (state: GameState): number =>
  Object.values(state.puzzleProgress).reduce(
    (total, progress) => total + progress.hintsRevealed + (progress.solutionShown ? 1 : 0),
    0,
  );

export const selectPuzzleProgress = (state: GameState, puzzleId: PuzzleId) =>
  state.puzzleProgress[puzzleId];

export const selectCanAttemptFinale = (state: GameState, content: GameContent): boolean => {
  const viewed = new Set(state.viewedMaterialIds);
  return (
    content.puzzles.every((puzzle) => state.puzzleProgress[puzzle.id]?.solved) &&
    content.requiredForFinale.every((materialId) => viewed.has(materialId))
  );
};

export const selectInvestigationProgress = (state: GameState, content: GameContent): number => {
  const totalUnits = content.materials.length + content.puzzles.length;
  if (!totalUnits) return 0;
  const viewed = new Set(state.viewedMaterialIds);
  const materialCount = content.materials.filter((material) => viewed.has(material.id)).length;
  const puzzleCount = content.puzzles.filter(
    (puzzle) => state.puzzleProgress[puzzle.id]?.solved,
  ).length;
  return Math.round(((materialCount + puzzleCount) / totalUnits) * 100);
};

export const formatElapsedTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};
