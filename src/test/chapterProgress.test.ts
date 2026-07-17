import { describe, expect, it } from 'vitest';
import { caseContent as gameContent } from '../data/caseContent';
import {
  completePuzzleFreeChapter,
  getNextChapterId,
  solvePuzzleProgress,
} from '../state/chapterProgress';
import { createInitialGameState } from '../state/defaultState';

describe('открытие глав', () => {
  it('не открывает следующую главу до изучения вводных материалов', () => {
    const state = createInitialGameState();
    expect(completePuzzleFreeChapter(state, 'chapter-1', gameContent)).toBe(state);
  });

  it('открывает вторую главу после изучения вводных материалов', () => {
    const state = {
      ...createInitialGameState(),
      viewedMaterialIds: [...(gameContent.chapters[0]?.materialIds ?? [])],
    };
    const progressed = completePuzzleFreeChapter(state, 'chapter-1', gameContent);
    expect(progressed.unlockedChapterIds).toContain('chapter-2');
    expect(progressed.unlockedMaterialIds).toContain('MAT-10');
    expect(progressed.unlockedMaterialIds).not.toContain('MAT-12');
  });

  it('открывает награду и следующую главу после решения задачи', () => {
    const state = {
      ...createInitialGameState(),
      unlockedChapterIds: ['chapter-1', 'chapter-2'],
      unlockedMaterialIds: [
        ...createInitialGameState().unlockedMaterialIds,
        'MAT-10',
        'MAT-11',
      ],
    };
    const progressed = solvePuzzleProgress(state, 'camera-sequence', gameContent);
    expect(progressed.puzzleProgress['camera-sequence']?.solved).toBe(true);
    expect(progressed.unlockedMaterialIds).toContain('MAT-12');
    expect(progressed.unlockedChapterIds).toContain('chapter-3');
    expect(getNextChapterId(gameContent, 'chapter-5')).toBeNull();
  });
});
