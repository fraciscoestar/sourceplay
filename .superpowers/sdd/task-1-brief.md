### Task 1: Expanded Spanish Lexicon & Inflection Engine

**Files:**
- Modify: `packages/wordle/src/raeWords.ts`
- Modify: `packages/wordle/src/words.ts:1-75`

**Interfaces:**
- Consumes: `SPANISH_WORDS` from `@sourceplay/wordsearch`
- Produces: `VALIDATION_SET: Set<string>` containing full inflected Spanish lexicon (~350,000 words).

- [ ] **Step 1: Expand `raeWords.ts` dataset with full inflected wordlist**

Integrate expanded Spanish frequency wordlist into `packages/wordle/src/raeWords.ts`.

- [ ] **Step 2: Update `words.ts` inflection builder**

In `packages/wordle/src/words.ts`, update `RAW_DICTIONARY_SET` initialization to run dynamic inflection rules (+S for vowel endings, +ES for consonant endings, Z->CES) for both original and accent-normalized entries.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/wordle/tsconfig.json`
Expected: PASS (0 errors)

- [ ] **Step 4: Commit**

```bash
git add packages/wordle/src/raeWords.ts packages/wordle/src/words.ts
git commit -m "feat(wordle): expand validation dictionary with full inflections and Spanish wordforms"
```

---

