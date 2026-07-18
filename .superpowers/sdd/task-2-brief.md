### Task 2: Wordlist Extraction and Accent Cleaning

**Files:**
- Create: `packages/wordsearch/src/words.ts`
- Create: `packages/wordsearch/src/test-words.ts`
- Modify: `packages/wordsearch/src/core.ts`

**Interfaces:**
- Produces: `cleanWord(word: string): string` (accent-stripped uppercase word).
- Produces: `SPANISH_WORDS: string[]` (deduplicated dictionary of $\ge 5000$ Spanish words).

- [ ] **Step 1: Write script to fetch and format Spanish wordlist**
  Create a temporary script `packages/wordsearch/scratch/download-words.js` to pull 5000+ words from the raw GitHub list, filter for lengths 4-10, remove accents (preserving Ñ), deduplicate, and write out to `src/words.ts`:
  ```javascript
  const fs = require('fs');
  const https = require('https');
  const path = require('path');

  const url = 'https://raw.githubusercontent.com/mazyvan/most-common-spanish-words/master/most-common-spanish-words-v4.txt';
  const outputPath = path.join(__dirname, '../src/words.ts');

  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const lines = data.split('\n');
      const uniqueWords = new Set();
      
      const clean = (w) => {
        return w.trim()
          .toLowerCase()
          .replace(/[áä]/g, 'a')
          .replace(/[éë]/g, 'e')
          .replace(/[íï]/g, 'i')
          .replace(/[óö]/g, 'o')
          .replace(/[úü]/g, 'u')
          .toUpperCase();
      };

      for (let line of lines) {
        const word = clean(line);
        if (/^[A-ZÑ]{4,15}$/.test(word)) {
          uniqueWords.add(word);
        }
      }

      const list = Array.from(uniqueWords);
      console.log(`Fetched ${list.length} valid words.`);

      const content = `export const SPANISH_WORDS = ${JSON.stringify(list, null, 2)};\n`;
      fs.writeFileSync(outputPath, content);
      console.log('Saved src/words.ts');
    });
  });
  ```

- [ ] **Step 2: Run download script**
  Run: `node packages/wordsearch/scratch/download-words.js`
  Verify that `packages/wordsearch/src/words.ts` is created and contains over 5000 unique words.

- [ ] **Step 3: Create core.ts with cleanWord function**
  Write to `packages/wordsearch/src/core.ts`:
  ```typescript
  export function cleanWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/[áä]/g, 'a')
      .replace(/[éë]/g, 'e')
      .replace(/[íï]/g, 'i')
      .replace(/[óö]/g, 'o')
      .replace(/[úü]/g, 'u')
      .toUpperCase();
  }
  ```

- [ ] **Step 4: Create word validation test script**
  Write to `packages/wordsearch/src/test-words.ts`:
  ```typescript
  import { SPANISH_WORDS } from './words';
  import { cleanWord } from './core';

  function testWordlist() {
    console.log('Testing wordlist...');
    if (SPANISH_WORDS.length < 5000) {
      throw new Error(`Wordlist too small: ${SPANISH_WORDS.length}`);
    }
    const cleanTest = cleanWord('áéíóúüñ');
    if (cleanTest !== 'AEIOUUN') {
      throw new Error(`Accent cleaning failed: ${cleanTest}`);
    }
    console.log('Wordlist test PASSED. Word count:', SPANISH_WORDS.length);
  }

  testWordlist();
  ```

- [ ] **Step 5: Run tests**
  Run: `npx vite-node packages/wordsearch/src/test-words.ts`
  Expected output: `Wordlist test PASSED. Word count: <count>` (where count $\ge 5000$).

---
