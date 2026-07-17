import { describe, expect, it } from 'vitest';
import { answerWordVariants, normalizeAnswer } from '../utils/normalize';

describe('normalizeAnswer', () => {
  it('нормализует регистр, ё, пунктуацию и пробелы', () => {
    expect(normalizeAnswer('  АлЁНА—СЕРГЕЕВА,  ')).toBe('алена сергеева');
  });

  it('не удаляет русские и латинские буквы или цифры', () => {
    expect(normalizeAnswer('Дом Вереск-7')).toBe('дом вереск 7');
  });

  it('создаёт варианты прямого и обратного порядка слов', () => {
    expect(answerWordVariants('Ирина Волкова')).toEqual(['ирина волкова', 'волкова ирина']);
    expect(answerWordVariants('')).toEqual([]);
  });
});
