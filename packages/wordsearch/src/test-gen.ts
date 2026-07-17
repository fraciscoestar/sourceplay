import { generateWordSearch } from './core';

function testGenerator() {
  console.log('Testing board generator...');
  const b1 = generateWordSearch('medio', 'sourceplay');
  const b2 = generateWordSearch('medio', 'sourceplay');

  // Test determinism
  if (JSON.stringify(b1.grid) !== JSON.stringify(b2.grid)) {
    throw new Error('Determinism check failed: boards generated from the same seed differ!');
  }

  // Test distinct word lists
  const b3 = generateWordSearch('medio', 'anotherseed');
  if (JSON.stringify(b1.words) === JSON.stringify(b3.words)) {
    throw new Error('Word variety check failed: same words picked for different seeds!');
  }

  // Verify word counts
  if (b1.words.length !== 10) {
    throw new Error(`Expected 10 words, got ${b1.words.length}`);
  }

  // Verify all difficulty levels
  const difficulties = [
    { name: 'facil', expectedSize: 10, expectedWordCount: 7 },
    { name: 'medio', expectedSize: 13, expectedWordCount: 10 },
    { name: 'dificil', expectedSize: 16, expectedWordCount: 14 },
    { name: 'experto', expectedSize: 20, expectedWordCount: 19 }
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
    console.log(`Difficulty '${diff.name}' checked: grid ${diff.expectedSize}x${diff.expectedSize}, words: ${diff.expectedWordCount}`);
  }

  console.log('Generator test PASSED. Words chosen for medio:', b1.words.join(', '));
}

testGenerator();
