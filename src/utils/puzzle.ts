export const reorder = <T>(items: readonly T[], fromIndex: number, toIndex: number): T[] => {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }

  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  if (moved !== undefined) copy.splice(toIndex, 0, moved);
  return copy;
};

export const isExactSequence = (attempt: readonly string[], expected: readonly string[]): boolean =>
  attempt.length === expected.length && attempt.every((item, index) => item === expected[index]);

export const normalizeSignalTokens = (value: string): string =>
  value
    .toLocaleUpperCase('ru-RU')
    .replace(/[^А-ЯA-Z0-9]+/gu, '')
    .trim();

export const matchesSignalAnswer = (attempt: string, accepted: readonly string[]): boolean => {
  const normalized = normalizeSignalTokens(attempt);
  return accepted.some((answer) => normalizeSignalTokens(answer) === normalized);
};

export interface FragmentPosition {
  id: string;
  x: number;
  y: number;
}

export const isFragmentNearTarget = (
  fragment: FragmentPosition,
  target: FragmentPosition,
  tolerance = 8,
): boolean =>
  fragment.id === target.id &&
  Math.abs(fragment.x - target.x) <= tolerance &&
  Math.abs(fragment.y - target.y) <= tolerance;

export const hasRequiredTheoryEvidence = (
  theoryIds: readonly string[],
  requiredGroups: readonly (readonly string[])[],
): boolean => {
  const theory = new Set(theoryIds);
  return requiredGroups.every((group) => group.every((id) => theory.has(id)));
};
