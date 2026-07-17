import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state/defaultState';
import { gameReducer } from '../state/reducer';

describe('подсказки', () => {
  it('открывает максимум три уровня', () => {
    let state = createInitialGameState();
    for (let index = 0; index < 5; index += 1) {
      state = gameReducer(state, { type: 'REVEAL_HINT', puzzleId: 'camera-sequence' });
    }
    expect(state.puzzleProgress['camera-sequence']?.hintsRevealed).toBe(3);
  });

  it('показывает решение шага только после третьей подсказки', () => {
    const initial = createInitialGameState();
    const denied = gameReducer(initial, {
      type: 'SHOW_PUZZLE_SOLUTION',
      puzzleId: 'camera-sequence',
    });
    expect(denied.puzzleProgress['camera-sequence']?.solutionShown).toBe(false);

    let ready = initial;
    for (let index = 0; index < 3; index += 1) {
      ready = gameReducer(ready, { type: 'REVEAL_HINT', puzzleId: 'camera-sequence' });
    }
    const shown = gameReducer(ready, {
      type: 'SHOW_PUZZLE_SOLUTION',
      puzzleId: 'camera-sequence',
    });
    expect(shown.puzzleProgress['camera-sequence']?.solutionShown).toBe(true);
  });
});
