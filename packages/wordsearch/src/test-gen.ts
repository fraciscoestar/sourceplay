import { generateWordSearch } from './core';
import { SPANISH_WORDS } from './words';

function testGenerator() {
  console.log('Testing board generator...');

  const verifyNoSubstrings = (words: string[]) => {
    for (let i = 0; i < words.length; i++) {
      for (let j = 0; j < words.length; j++) {
        if (i === j) continue;
        if (words[i].includes(words[j])) {
          throw new Error(`Substring conflict found: "${words[j]}" is a substring of "${words[i]}" in word list [${words.join(', ')}]`);
        }
      }
    }
  };

  const b1 = generateWordSearch('medio', 'sourceplay');
  const b2 = generateWordSearch('medio', 'sourceplay');

  // Test determinism
  if (JSON.stringify(b1.grid) !== JSON.stringify(b2.grid)) {
    throw new Error('Determinism check failed: boards generated from the same seed differ!');
  }
  verifyNoSubstrings(b1.words);

  // Test distinct word lists
  const b3 = generateWordSearch('medio', 'anotherseed');
  if (JSON.stringify(b1.words) === JSON.stringify(b3.words)) {
    throw new Error('Word variety check failed: same words picked for different seeds!');
  }
  verifyNoSubstrings(b3.words);

  // Verify word counts
  if (b1.words.length !== 8) {
    throw new Error(`Expected 8 words, got ${b1.words.length}`);
  }

  // Verify all difficulty levels
  const difficulties = [
    { name: 'facil', expectedSize: 7, expectedWordCount: 6 },
    { name: 'medio', expectedSize: 10, expectedWordCount: 8 },
    { name: 'dificil', expectedSize: 13, expectedWordCount: 11 },
    { name: 'experto', expectedSize: 16, expectedWordCount: 14 }
  ];

  for (const diff of difficulties) {
    const board = generateWordSearch(diff.name, 'sourceplay');
    if (board.grid.length !== diff.expectedSize) {
      throw new Error(`Difficulty ${diff.name} expected size ${diff.expectedSize}, got ${board.grid.length}`);
    }
    for (const row of board.grid) {
      if (row.length !== diff.expectedSize) {
        throw new Error(`Difficulty ${diff.name} expected row size ${diff.expectedSize}, got ${row.length}`);
      }
    }
    if (board.words.length !== diff.expectedWordCount) {
      throw new Error(`Difficulty ${diff.name} expected ${diff.expectedWordCount} words, got ${board.words.length}`);
    }
    verifyNoSubstrings(board.words);
    console.log(`Difficulty '${diff.name}' checked: grid ${diff.expectedSize}x${diff.expectedSize}, words: ${diff.expectedWordCount}`);
  }

  // Test palindrome support
  console.log('Testing palindrome support...');
  const originalWords = [...SPANISH_WORDS];
  try {
    SPANISH_WORDS.length = 0;
    SPANISH_WORDS.push('RADAR', 'ELLE', 'CASA', 'LUNA', 'MESA', 'ROPA', 'PISO', 'CENA', 'BOLA', 'TEMA');
    
    const board = generateWordSearch('medio', 'palindrometest');
    
    if (!board.words.includes('RADAR') || !board.words.includes('ELLE')) {
      throw new Error('Test setup error: RADAR or ELLE not selected');
    }
    verifyNoSubstrings(board.words);
    console.log('Palindrome board generated successfully with words:', board.words.join(', '));
  } finally {
    SPANISH_WORDS.length = 0;
    SPANISH_WORDS.push(...originalWords);
  }

  console.log('Generator test PASSED. Words chosen for medio:', b1.words.join(', '));
}

testGenerator();
