import { describe, expect, it } from 'vitest';
import {
  hasRequiredTheoryEvidence,
  isExactSequence,
  isFragmentNearTarget,
  matchesSignalAnswer,
  reorder,
} from '../utils/puzzle';

describe('состояния головоломок', () => {
  it('переставляет элементы без потери и проверяет порядок', () => {
    const moved = reorder(['a', 'b', 'c'], 2, 0);
    expect(moved).toEqual(['c', 'a', 'b']);
    expect(isExactSequence(moved, ['c', 'a', 'b'])).toBe(true);
    expect(isExactSequence(moved, ['a', 'b', 'c'])).toBe(false);
  });

  it('нормализует визуально расшифрованную команду', () => {
    expect(matchesSignalAnswer('метка-7', ['МЕТКА 7'])).toBe(true);
    expect(matchesSignalAnswer('метка-8', ['МЕТКА 7'])).toBe(false);
  });

  it('примагничивает только правильный фрагмент рядом с целью', () => {
    expect(
      isFragmentNearTarget({ id: 'f1', x: 99, y: 102 }, { id: 'f1', x: 100, y: 100 }, 4),
    ).toBe(true);
    expect(
      isFragmentNearTarget({ id: 'f2', x: 99, y: 102 }, { id: 'f1', x: 100, y: 100 }, 4),
    ).toBe(false);
  });

  it('требует все улики каждой независимой цепочки', () => {
    const groups = [['time-a', 'time-b'], ['access-a'], ['audio-a', 'audio-b']];
    expect(
      hasRequiredTheoryEvidence(['time-a', 'time-b', 'access-a', 'audio-a', 'audio-b'], groups),
    ).toBe(true);
    expect(hasRequiredTheoryEvidence(['time-b', 'access-a', 'audio-a'], groups)).toBe(false);
    expect(hasRequiredTheoryEvidence(['time-b', 'audio-a'], groups)).toBe(false);
  });
});
