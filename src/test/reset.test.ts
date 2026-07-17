import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state/defaultState';
import { gameReducer } from '../state/reducer';

describe('сброс прогресса', () => {
  it('очищает расследование и сохраняет пользовательские настройки', () => {
    const changed = {
      ...createInitialGameState(),
      hasStarted: true,
      notes: 'важная версия',
      viewedMaterialIds: ['briefing'],
      elapsedSeconds: 800,
      settings: {
        audio: { enabled: true, volume: 0.63 },
        accessibility: { reducedMotion: true, highContrast: true, largeText: false },
      },
    };
    const reset = gameReducer(changed, { type: 'RESET_GAME' });
    expect(reset).toMatchObject({
      hasStarted: false,
      notes: '',
      viewedMaterialIds: [],
      elapsedSeconds: 0,
      settings: changed.settings,
    });
  });

  it('может вернуть настройки по умолчанию', () => {
    const changed = {
      ...createInitialGameState(),
      settings: {
        ...createInitialGameState().settings,
        audio: { enabled: true, volume: 0.9 },
      },
    };
    const reset = gameReducer(changed, { type: 'RESET_GAME', preserveSettings: false });
    expect(reset.settings.audio).toEqual({ enabled: false, volume: 0.28 });
  });
});
