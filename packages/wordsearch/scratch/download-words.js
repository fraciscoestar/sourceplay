import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      if (/^[A-ZÑ]{4,10}$/.test(word)) {
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
