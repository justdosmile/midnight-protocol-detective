import { describe, expect, it } from 'vitest';
import { caseContent } from '../data/caseContent';

const unique = (values: string[]) => new Set(values).size === values.length;

describe('контракт игрового контента', () => {
  it('содержит полный связный набор глав, задач и материалов', () => {
    expect(caseContent.chapters).toHaveLength(5);
    expect(caseContent.puzzles).toHaveLength(5);
    expect(caseContent.suspects).toHaveLength(5);
    expect(caseContent.materials.length).toBeGreaterThanOrEqual(18);
    expect(unique(caseContent.materials.map((material) => material.id))).toBe(true);
    expect(unique(caseContent.puzzles.map((puzzle) => puzzle.id))).toBe(true);

    const materialIds = new Set(caseContent.materials.map((material) => material.id));
    const puzzleIds = new Set(caseContent.puzzles.map((puzzle) => puzzle.id));
    for (const chapter of caseContent.chapters) {
      expect(chapter.materialIds.every((id) => materialIds.has(id))).toBe(true);
      expect(chapter.puzzleIds.every((id) => puzzleIds.has(id))).toBe(true);
    }
    expect(caseContent.requiredForFinale.every((id) => materialIds.has(id))).toBe(true);
  });

  it('связывает каждую задачу с подсказками и валидной конфигурацией', () => {
    const materialIds = new Set(caseContent.materials.map((material) => material.id));
    for (const puzzle of caseContent.puzzles) {
      expect(caseContent.hints.some((hint) => hint.puzzleId === puzzle.id)).toBe(true);
      expect(puzzle.requiredMaterialIds.every((id) => materialIds.has(id))).toBe(true);
      expect(puzzle.unlockMaterialIds.every((id) => materialIds.has(id))).toBe(true);

      if (puzzle.interaction.type === 'sequence') {
        const itemIds = new Set(puzzle.interaction.items.map((item) => item.id));
        expect(puzzle.interaction.correctOrder.every((id) => itemIds.has(id))).toBe(true);
      }
      if (puzzle.interaction.type === 'reconstruction') {
        const fragmentIds = new Set(puzzle.interaction.fragments.map((item) => item.id));
        expect(puzzle.interaction.correctSlotOrder.every((id) => fragmentIds.has(id))).toBe(true);
        expect(puzzle.interaction.correctSlotOrder).toHaveLength(puzzle.interaction.slots.length);
      }
      if (puzzle.interaction.type === 'board') {
        expect(
          puzzle.interaction.requiredGroups.flat().every((id) => materialIds.has(id)),
        ).toBe(true);
        const boardEligibleIds = new Set(
          caseContent.materials
            .filter((material) => material.boardEligible)
            .map((material) => material.id),
        );
        expect(
          puzzle.interaction.requiredGroups.flat().every((id) => boardEligibleIds.has(id)),
        ).toBe(true);
      }
    }
  });
});
