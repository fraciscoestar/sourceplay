import { SPANISH_WORDS } from './words';
import { cleanWord } from './core';

function testWordlist() {
  console.log('Testing wordlist...');
  if (SPANISH_WORDS.length < 5000) {
    throw new Error(`Wordlist too small: ${SPANISH_WORDS.length}`);
  }
  const cleanTest = cleanWord('áéíóúüñ');
  if (cleanTest !== 'AEIOUUÑ') {
    throw new Error(`Accent cleaning failed: ${cleanTest}`);
  }
  console.log('Wordlist test PASSED. Word count:', SPANISH_WORDS.length);
}

testWordlist();
