export const normalizeAnswer = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .replace(/[.,;:!?"'«»()[\]{}\-_—–/\\]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

export const answerWordVariants = (value: string): string[] => {
  const normalized = normalizeAnswer(value);
  if (!normalized) return [];

  const words = normalized.split(' ');
  const reverse = [...words].reverse().join(' ');
  return [...new Set([normalized, reverse])];
};
