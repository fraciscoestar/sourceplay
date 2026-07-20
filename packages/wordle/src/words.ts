import { SPANISH_WORDS } from '../../wordsearch/src/words';
import { RAE_WORDS } from './raeWords';

// Accent removal helper preserving Ñ
export function removeAccents(str: string): string {
  const map: Record<string, string> = {
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ú': 'U',
    'Ü': 'U', 'ü': 'U'
  };
  return str.replace(/[ÁÉÍÓÚáéíóúÜü]/g, (m) => map[m] || m);
}

// Full RAE Dictionary words + SPANISH_WORDS dataset for validation
export const RAW_DICTIONARY_SET = new Set<string>();

// Populate RAW_DICTIONARY_SET with uppercase and normalized entries
SPANISH_WORDS.forEach((w) => {
  const upper = w.toUpperCase();
  if (upper.length >= 4 && upper.length <= 10) {
    RAW_DICTIONARY_SET.add(upper);
    RAW_DICTIONARY_SET.add(removeAccents(upper));
  }
});

RAE_WORDS.forEach((w) => {
  const upper = w.toUpperCase();
  if (upper.length >= 4 && upper.length <= 10) {
    RAW_DICTIONARY_SET.add(upper);
    RAW_DICTIONARY_SET.add(removeAccents(upper));
  }
});

// Alias for validation set
export const VALIDATION_SET = RAW_DICTIONARY_SET;

// Hybrid secret word pool (~20,000 words)
const secretPoolSet = new Set<string>();
for (const w of SPANISH_WORDS) {
  const upper = w.toUpperCase();
  if (upper.length >= 4 && upper.length <= 10) {
    secretPoolSet.add(upper);
  }
}
for (const w of RAE_WORDS) {
  if (secretPoolSet.size >= 20000) break;
  const upper = w.toUpperCase();
  if (upper.length >= 4 && upper.length <= 10) {
    secretPoolSet.add(upper);
  }
}

export const SECRET_POOL: string[] = Array.from(secretPoolSet);

export function isValidWord(word: string): boolean {
  if (!word || word.length < 4 || word.length > 10) return false;
  const upper = word.toUpperCase();
  const normalized = removeAccents(upper);
  return RAW_DICTIONARY_SET.has(upper) || RAW_DICTIONARY_SET.has(normalized);
}

export function isTooShort(word: string): boolean {
  return word.length < 4;
}

export function getSeededWord(prng: () => number, tildesMode: boolean): string {
  const pool = SECRET_POOL.length > 0 ? SECRET_POOL : Array.from(RAW_DICTIONARY_SET);
  const idx = Math.floor(prng() * pool.length);
  const word = pool[idx];
  return tildesMode ? word : removeAccents(word);
}
