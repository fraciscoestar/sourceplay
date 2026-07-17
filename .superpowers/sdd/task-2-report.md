# Task 2 Report: Wordlist Extraction and Accent Cleaning

## What Was Implemented

1. **Spanish Wordlist Fetching Script**: Created a script at [download-words.js](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/scratch/download-words.js) that downloads the 10,000 most common Spanish words, normalizes them, filters them (keeping words between length 4 and 10), and exports them as `SPANISH_WORDS` in [words.ts](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/words.ts). Note that we updated the regex to match the brief's text description of filtering for lengths 4-10 (`/^[A-ZÑ]{4,10}$/`).
2. **Accent Cleaning**: Implemented the [cleanWord](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts) utility function in [core.ts](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts), which strips accents and converts characters to uppercase while properly preserving `Ñ`.
3. **Validation & Verification**: Created a test script at [test-words.ts](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/test-words.ts) which asserts the dictionary has at least 5000 words and that accent cleaning behaves correctly.

---

## TDD Evidence

### Failing Test Run Output
First, running with a dummy implementation of [cleanWord](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts#L1-L4) (which just converted to uppercase without replacing accents):

```
Testing wordlist...
C:\Users\Fraci\Desktop\typescript projects\sourceplay\packages\wordsearch\src\test-words.ts:12
		throw new Error(`Accent cleaning failed: ${cleanTest}`);
		      ^

Error: Accent cleaning failed: ÁÉÍÓÚÜÑ
    at testWordlist (C:\Users\Fraci\Desktop\typescript projects\sourceplay\packages\wordsearch\src\test-words.ts:11:11)
    at C:\Users\Fraci\Desktop\typescript projects\sourceplay\packages\wordsearch\src\test-words.ts:16:1
    at ViteNodeRunner.runModule (file:///C:/Users/Fraci/AppData/Local/npm-cache/_npx/f2342a4b64a2bc92/node_modules/vite-node/dist/client.mjs:368:4)
    at ViteNodeRunner.directRequest (file:///C:/Users/Fraci/AppData/Local/npm-cache/_npx/f2342a4b64a2bc92/node_modules/vite-node/dist/client.mjs:348:3)
    at ViteNodeRunner.cachedRequest (file:///C:/Users/Fraci/AppData/Local/npm-cache/_npx/f2342a4b64a2bc92/node_modules/vite-node/dist/client.mjs:181:11)
    at ViteNodeRunner.executeFile (file:///C:/Users/Fraci/AppData/Local/npm-cache/_npx/f2342a4b64a2bc92/node_modules/vite-node/dist/client.mjs:156:10)
    at CAC.run (file:///C:/Users/Fraci/AppData/Local/npm-cache/_npx/f2342a4b64a2bc92/node_modules/vite-node/dist/cli.mjs:92:28)

Node.js v24.14.1
```

### Passing Test Run Output
After implementing the accent-replacement rules in [cleanWord](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts#L1-L10):

```
Testing wordlist...
Wordlist test PASSED. Word count: 9385
```

---

## Verification Steps and Outputs

1. Run the download script:
   ```bash
   node packages/wordsearch/scratch/download-words.js
   ```
   *Output:*
   ```
   Fetched 9385 valid words.
   Saved src/words.ts
   ```

2. Run the test/verification script using `vite-node`:
   ```bash
   npx vite-node packages/wordsearch/src/test-words.ts
   ```
   *Output:*
   ```
   Testing wordlist...
   Wordlist test PASSED. Word count: 9385
   ```

---

## Files Changed

- [download-words.js](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/scratch/download-words.js) (Created)
- [words.ts](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/words.ts) (Created)
- [core.ts](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/core.ts) (Created)
- [test-words.ts](file:///C:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordsearch/src/test-words.ts) (Created)

---

## Self-Review Findings

- **Distinct Spanish Words**: Verified that we fetched `9385` unique Spanish words of lengths 4-10, which easily satisfies the criteria of $\ge 5000$ words.
- **Accent Cleaning & Ñ**: Verified that `cleanWord` strips Spanish accents (`áéíóúü`) and correctly keeps `Ñ` in uppercase, matching the assertion in the test.
- **Test Suitability**: The test script runs fast and asserts exactly the contract needed.

---

## Issues or Concerns
None. Everything works correctly and is verified.
