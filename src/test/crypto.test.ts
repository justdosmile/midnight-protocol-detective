import { describe, expect, it } from 'vitest';
import { decryptSolutionPayload, encryptSolutionPayload } from '../utils/crypto';

describe('AES-GCM bundle', () => {
  it('расшифровывает тестовый payload нормализованным ответом', async () => {
    const payload = { status: 'ok', paragraphs: ['Тестовые данные без сюжетного решения'] };
    const bundle = await encryptSolutionPayload('Алёна Тестова', payload, {
      salt: new Uint8Array(16).fill(3),
      iv: new Uint8Array(12).fill(7),
      iterations: 1_000,
    });
    await expect(decryptSolutionPayload('  АЛЕНА-ТЕСТОВА ', bundle)).resolves.toEqual(payload);
    await expect(decryptSolutionPayload('другой ответ', bundle)).resolves.toBeNull();
  });
});
