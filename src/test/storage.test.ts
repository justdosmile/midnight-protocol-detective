import { describe, expect, it } from 'vitest';
import { caseContent as gameContent } from '../data/caseContent';
import { CURRENT_SAVE_VERSION, createInitialGameState } from '../state/defaultState';
import {
  SAVE_STORAGE_KEY,
  clearGameState,
  loadGameState,
  saveGameState,
  type StorageLike,
} from '../state/storage';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('версионированное сохранение', () => {
  it('сохраняет и восстанавливает прогресс', () => {
    const storage = new MemoryStorage();
    const state = {
      ...createInitialGameState(),
      hasStarted: true,
      notes: 'Проверить отражение',
      elapsedSeconds: 117,
    };
    expect(saveGameState(storage, state)).toBe(true);
    expect(loadGameState(storage)).toMatchObject({
      hasStarted: true,
      notes: 'Проверить отражение',
      elapsedSeconds: 117,
    });
  });

  it('безопасно мигрирует сохранение первой версии', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({
        saveVersion: 1,
        hasStarted: true,
        timerSeconds: 42,
        activeChapterId: 'chapter-1',
        unlockedChapterIds: ['chapter-1'],
        unlockedMaterialIds: gameContent.chapters[0]?.materialIds,
        settings: { soundEnabled: true, volume: 0.5 },
      }),
    );
    const migrated = loadGameState(storage);
    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.elapsedSeconds).toBe(42);
    expect(migrated.settings.audio).toEqual({ enabled: true, volume: 0.5 });
  });

  it('сбрасывает сохранение прошлой истории после полной смены дела', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({
        saveVersion: 3,
        hasStarted: true,
        hasFinished: true,
        puzzleProgress: {
          'photo-analysis': { solved: true, hintsRevealed: 0, solutionShown: false },
          'evidence-theory': { solved: true, hintsRevealed: 0, solutionShown: false },
        },
      }),
    );
    const reset = loadGameState(storage);
    expect(reset.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(reset.hasStarted).toBe(false);
    expect(reset.hasFinished).toBe(false);
    expect(reset.puzzleProgress['photo-analysis']?.solved).toBe(false);
    expect(reset.puzzleProgress['evidence-theory']?.solved).toBe(false);
  });

  it('сбрасывает повреждённый JSON и умеет удалить запись', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, '{broken');
    expect(loadGameState(storage).hasStarted).toBe(false);
    expect(clearGameState(storage)).toBe(true);
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
  });
});
