import { caseContent as gameContent } from '../data/caseContent';
import type {
  ChapterId,
  GameContent,
  GameSettings,
  GameState,
  PuzzleId,
  PuzzleProgress,
} from '../types/game';
import { CURRENT_SAVE_VERSION, createInitialGameState } from './defaultState';

export const SAVE_STORAGE_KEY = 'three-short-rings:save';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringArray = (value: unknown, allowed: Set<string>): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && allowed.has(item)))]
    : [];

const finiteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const booleanValue = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const sanitizeSettings = (value: unknown, fallback: GameSettings): GameSettings => {
  if (!isRecord(value)) return structuredClone(fallback);
  const audio = isRecord(value.audio) ? value.audio : {};
  const accessibility = isRecord(value.accessibility) ? value.accessibility : {};

  return {
    audio: {
      enabled: booleanValue(audio.enabled, fallback.audio.enabled),
      volume: Math.min(1, Math.max(0, finiteNumber(audio.volume, fallback.audio.volume))),
    },
    accessibility: {
      reducedMotion: booleanValue(
        accessibility.reducedMotion,
        fallback.accessibility.reducedMotion,
      ),
      highContrast: booleanValue(
        accessibility.highContrast,
        fallback.accessibility.highContrast,
      ),
      largeText: booleanValue(accessibility.largeText, fallback.accessibility.largeText),
    },
  };
};

const sanitizePuzzleProgress = (
  value: unknown,
  fallback: Record<PuzzleId, PuzzleProgress>,
): Record<PuzzleId, PuzzleProgress> => {
  if (!isRecord(value)) return fallback;
  const entries = Object.entries(fallback).map(([id, defaultProgress]) => {
    const raw = isRecord(value[id]) ? value[id] : {};
    return [
      id,
      {
        solved: booleanValue(raw.solved, defaultProgress.solved),
        hintsRevealed: Math.min(3, Math.max(0, finiteNumber(raw.hintsRevealed, 0))),
        solutionShown: booleanValue(raw.solutionShown, false),
        ...(raw.value === undefined ? {} : { value: raw.value }),
      },
    ] as const;
  });
  return Object.fromEntries(entries);
};

const migrateLegacySave = (value: Record<string, unknown>): Record<string, unknown> => {
  if (value.saveVersion === CURRENT_SAVE_VERSION) return value;
  if (value.saveVersion !== 1) return {};

  const legacySettings: Record<string, unknown> = isRecord(value.settings) ? value.settings : {};
  return {
    ...value,
    saveVersion: CURRENT_SAVE_VERSION,
    elapsedSeconds: value.elapsedSeconds ?? value.timerSeconds,
    settings: {
      ...legacySettings,
      audio: {
        enabled: legacySettings.soundEnabled ?? false,
        volume: legacySettings.volume ?? 0.28,
      },
    },
  };
};

export const sanitizeGameState = (
  value: unknown,
  content: GameContent = gameContent,
): GameState => {
  const fallback = createInitialGameState(undefined, content);
  if (!isRecord(value)) return fallback;
  const migrated = migrateLegacySave(value);
  if (!isRecord(migrated) || migrated.saveVersion !== CURRENT_SAVE_VERSION) return fallback;

  const chapterIds = new Set(content.chapters.map((chapter) => chapter.id));
  const materialIds = new Set(content.materials.map((material) => material.id));
  const unlockedChapterIds: ChapterId[] = stringArray(migrated.unlockedChapterIds, chapterIds);
  const activeChapterCandidate =
    typeof migrated.activeChapterId === 'string' ? migrated.activeChapterId : '';
  const activeChapterId = chapterIds.has(activeChapterCandidate)
    ? activeChapterCandidate
    : fallback.activeChapterId;
  const selectedMaterialId =
    typeof migrated.selectedMaterialId === 'string' && materialIds.has(migrated.selectedMaterialId)
      ? migrated.selectedMaterialId
      : null;
  const unlockedMaterialIds = stringArray(migrated.unlockedMaterialIds, materialIds);

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    hasStarted: booleanValue(migrated.hasStarted, fallback.hasStarted),
    hasFinished: booleanValue(migrated.hasFinished, fallback.hasFinished),
    activeChapterId,
    selectedMaterialId,
    viewedMaterialIds: stringArray(migrated.viewedMaterialIds, materialIds),
    unlockedChapterIds: unlockedChapterIds.length
      ? unlockedChapterIds
      : fallback.unlockedChapterIds,
    unlockedMaterialIds: unlockedMaterialIds.length
      ? unlockedMaterialIds
      : fallback.unlockedMaterialIds,
    puzzleProgress: sanitizePuzzleProgress(migrated.puzzleProgress, fallback.puzzleProgress),
    notes: typeof migrated.notes === 'string' ? migrated.notes.slice(0, 20_000) : '',
    starredEvidenceIds: stringArray(migrated.starredEvidenceIds, materialIds),
    theoryEvidenceIds: stringArray(migrated.theoryEvidenceIds, materialIds),
    elapsedSeconds: Math.max(0, Math.floor(finiteNumber(migrated.elapsedSeconds, 0))),
    startedAt:
      typeof migrated.startedAt === 'number' && Number.isFinite(migrated.startedAt)
        ? migrated.startedAt
        : null,
    finishedAt:
      typeof migrated.finishedAt === 'number' && Number.isFinite(migrated.finishedAt)
        ? migrated.finishedAt
        : null,
    settings: sanitizeSettings(migrated.settings, fallback.settings),
  };
};

export const loadGameState = (
  storage: StorageLike,
  content: GameContent = gameContent,
): GameState => {
  try {
    const saved = storage.getItem(SAVE_STORAGE_KEY);
    return saved ? sanitizeGameState(JSON.parse(saved) as unknown, content) : createInitialGameState(undefined, content);
  } catch {
    return createInitialGameState(undefined, content);
  }
};

export const saveGameState = (storage: StorageLike, state: GameState): boolean => {
  try {
    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const clearGameState = (storage: StorageLike): boolean => {
  try {
    storage.removeItem(SAVE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};
