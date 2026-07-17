import { describe, expect, it } from 'vitest';
import { answerWordVariants, normalizeAnswer } from '../utils/normalize';

describe('normalizeAnswer', () => {
  it('нормализует регистр, ё, пунктуацию и пробелы', () => {
    expect(normalizeAnswer('  АлЁНА—СЕРГЕЕВА,  ')).toBe('алена сергеева');
  });

  it('не удаляет русские и латинские буквы или цифры', () => {
    expect(normalizeAnswer('Объект Север-7')).toBe('объект север 7');
  });

  it('создаёт варианты прямого и обратного порядка слов', () => {
    expect(answerWordVariants('Ирина Волкова')).toEqual(['ирина волкова', 'волкова ирина']);
    expect(answerWordVariants('')).toEqual([]);
  });
});
