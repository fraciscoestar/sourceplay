import { SPANISH_WORDS } from '../../wordsearch/src/words';
import { RAE_WORDS, EXPANDED_WORDS } from './raeWords';

// Accent removal helper preserving Ñ
export function removeAccents(str: string): string {
  const map: Record<string, string> = {
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ú': 'U',
    'Ü': 'U', 'ü': 'U'
  };
  return str.replace(/[ÁÉÍÓÚáéíóúÜü]/g, (m) => map[m] || m);
}

// Generate dynamic Spanish inflections (+S for vowels, +ES for consonants excluding S, Z->CES)
export function getInflections(word: string): string[] {
  const upper = word.toUpperCase();
  const results: string[] = [upper];
  if (upper.endsWith('Z')) {
    results.push(removeAccents(upper.slice(0, -1)) + 'CES');
  } else if (/[AEIOUÁÉÍÓÚÜ]$/.test(upper)) {
    results.push(upper + 'S');
  } else if (/[LNDRJTCMP]$/.test(upper)) {
    results.push(removeAccents(upper) + 'ES');
  }
  return results;
}

// Full RAE Dictionary words + SPANISH_WORDS dataset for validation with inflections
export const RAW_DICTIONARY_SET = new Set<string>();

function processWord(w: string) {
  const upper = w.toUpperCase();
  const normalized = removeAccents(upper);

  for (const entry of [upper, normalized]) {
    const inflections = getInflections(entry);
    for (const item of inflections) {
      if (item.length >= 4 && item.length <= 10) {
        RAW_DICTIONARY_SET.add(item);
        RAW_DICTIONARY_SET.add(removeAccents(item));
      }
    }
  }
}

SPANISH_WORDS.forEach(processWord);
RAE_WORDS.forEach(processWord);
EXPANDED_WORDS.forEach(processWord);

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
const remainingCount = 20000 - secretPoolSet.size;
if (remainingCount > 0) {
  const step = Math.max(1, Math.floor(RAE_WORDS.length / remainingCount));
  for (let i = 0; i < RAE_WORDS.length && secretPoolSet.size < 20000; i += step) {
    const w = RAE_WORDS[i];
    const upper = w.toUpperCase();
    if (upper.length >= 4 && upper.length <= 10) {
      secretPoolSet.add(upper);
    }
  }
  if (secretPoolSet.size < 20000) {
    for (const w of RAE_WORDS) {
      if (secretPoolSet.size >= 20000) break;
      const upper = w.toUpperCase();
      if (upper.length >= 4 && upper.length <= 10) {
        secretPoolSet.add(upper);
      }
    }
  }
}

export const SECRET_POOL: string[] = Array.from(secretPoolSet);

export function isValidWord(word: string): boolean {
  if (!word || word.length < 4 || word.length > 10) return false;
  const upper = word.toUpperCase();
  if (/[ÁÉÍÓÚÜ]/.test(upper)) {
    return RAW_DICTIONARY_SET.has(upper);
  }
  const normalized = removeAccents(upper);
  return RAW_DICTIONARY_SET.has(upper) || RAW_DICTIONARY_SET.has(normalized);
}

export function isTooShort(word: string): boolean {
  return word.length < 4;
}

export function getSeededWord(prng: () => number, tildesMode: boolean): string {
  const idx = Math.floor(prng() * SECRET_POOL.length);
  const word = SECRET_POOL[idx];
  return tildesMode ? word : removeAccents(word);
}
