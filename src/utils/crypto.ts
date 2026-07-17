import type { EncryptedSolutionBundle, RevealedSolution } from '../types/game';
import { normalizeAnswer } from './normalize';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const deriveKey = async (
  answer: string,
  salt: Uint8Array,
  iterations: number,
  usage: KeyUsage[],
): Promise<CryptoKey> => {
  const sourceKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalizeAnswer(answer)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    sourceKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usage,
  );
};

export const encryptSolutionPayload = async <T>(
  answer: string,
  payload: T,
  options: { salt?: Uint8Array; iv?: Uint8Array; iterations?: number } = {},
): Promise<EncryptedSolutionBundle> => {
  const salt = options.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const iv = options.iv ?? crypto.getRandomValues(new Uint8Array(12));
  const iterations = options.iterations ?? 150_000;
  const key = await deriveKey(answer, salt, iterations, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(JSON.stringify(payload)),
  );

  return {
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iterations,
  };
};

export const decryptSolutionPayload = async <T>(
  answer: string,
  bundle: EncryptedSolutionBundle,
): Promise<T | null> => {
  if (!normalizeAnswer(answer)) return null;

  try {
    const salt = base64ToBytes(bundle.salt);
    const iv = base64ToBytes(bundle.iv);
    const key = await deriveKey(answer, salt, bundle.iterations, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      base64ToBytes(bundle.ciphertext),
    );
    return JSON.parse(decoder.decode(decrypted)) as T;
  } catch {
    return null;
  }
};

export const decryptAnySolution = async (
  answer: string,
  bundles: EncryptedSolutionBundle[],
): Promise<RevealedSolution | null> => {
  for (const bundle of bundles) {
    const solution = await decryptSolutionPayload<RevealedSolution>(answer, bundle);
    if (solution) return solution;
  }
  return null;
};
