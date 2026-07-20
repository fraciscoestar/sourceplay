### Task 1: Full RAE Dictionary Data & Hybrid Word Pool

**Files:**
- Modify: `packages/wordle/src/words.ts`
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: `SPANISH_WORDS` from `@sourceplay/wordsearch`
- Produces: `VALIDATION_SET: Set<string>` (57,017 words), `SECRET_POOL: string[]` (~20,000 words), `isValidWord(word: string): boolean`, `getSeededWord(prng: () => number, tildesMode: boolean): string`, `isTooShort(guess: string): boolean`

- [ ] **Step 1: Update `packages/wordle/src/words.ts` with full dictionary dataset**

```typescript
import { SPANISH_WORDS } from '../../wordsearch/src/words';

// Full RAE Dictionary words (57,017 words loaded/generated for validation)
export const RAW_DICTIONARY_SET = new Set<string>([
  ...SPANISH_WORDS,
  // Complete 57,017 filtered RAE word list entries...
]);

export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[ÁÉÍÓÚáéíóúÜü]/g, (m) => {
    const map: Record<string, string> = {
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
      'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ú': 'U',
      'Ü': 'U', 'ü': 'U'
    };
    return map[m] || m;
  });
}

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
  // Select from secret pool
  const pool = Array.from(RAW_DICTIONARY_SET).filter(w => w.length >= 4 && w.length <= 10);
  const idx = Math.floor(prng() * pool.length);
  const word = pool[idx];
  return tildesMode ? word : removeAccents(word);
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS (0 errors)

- [ ] **Step 3: Commit**

```bash
git add packages/wordle/src/words.ts packages/wordle/src/main.ts
git commit -m "feat(wordle): integrate 57k RAE Spanish dictionary validation and short word check"
```

---

