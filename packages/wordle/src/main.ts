import { createHeader } from '@sourceplay/shared';
import { mulberry32, parseSeed, randomSeed } from './rng';
import { getSeededWord, isValidWord, removeAccents } from './words';

// State
let seedNum: number = 0;
let prng: () => number = () => 0;
let secretWord: string = '';
let currentGuess: string = '';
let guesses: string[] = [];
let isGameOver: boolean = false;

// Options
let tildesMode: boolean = false;
let hiddenLengthMode: boolean = false;
let timeTrialMode: boolean = false;

// Timer & Scores
let timerId: number | null = null;
let startTime: number = 0;
let elapsedTime: number = 0; // standard stopwatch
let timeTrialRemaining: number = 300; // 5 mins in seconds
let score: number = 0;
let wordStartTime: number = 0; // for skip penalty check

// DOM Elements
const startMenu = document.getElementById('startMenu') as HTMLDivElement;
const gameArea = document.getElementById('gameArea') as HTMLDivElement;
const menuTildesCheck = document.getElementById('menuTildesCheck') as HTMLInputElement;
const menuHiddenLengthCheck = document.getElementById('menuHiddenLengthCheck') as HTMLInputElement;
const menuTimeTrialCheck = document.getElementById('menuTimeTrialCheck') as HTMLInputElement;
const menuSeedInput = document.getElementById('menuSeedInput') as HTMLInputElement;
const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement;

const seedLabel = document.getElementById('seedLabel') as HTMLElement;
const scoreLabel = document.getElementById('scoreLabel') as HTMLDivElement;
const scoreCount = document.getElementById('scoreCount') as HTMLElement;
const gameModeTags = document.getElementById('gameModeTags') as HTMLDivElement;
const board = document.getElementById('board') as HTMLDivElement;
const attemptsContainer = document.getElementById('attemptsContainer') as HTMLDivElement;
const hiddenInput = document.getElementById('hiddenInput') as HTMLInputElement;

const skipWordBtn = document.getElementById('skipWordBtn') as HTMLButtonElement;
const revealWordBtn = document.getElementById('revealWordBtn') as HTMLButtonElement;
const restartGameBtn = document.getElementById('restartGameBtn') as HTMLButtonElement;
const exitToMenuBtn = document.getElementById('exitToMenuBtn') as HTMLButtonElement;

const timerEl = document.getElementById('timer') as HTMLElement;
const wordStatusLabel = document.getElementById('wordStatusLabel') as HTMLElement;

const toast = document.getElementById('toast') as HTMLDivElement;

// Modals
const endGameOverlay = document.getElementById('endGameOverlay') as HTMLDivElement;
const modalTitle = document.getElementById('modalTitle') as HTMLElement;
const modalDesc = document.getElementById('modalDesc') as HTMLElement;
const modalNextBtn = document.getElementById('modalNextBtn') as HTMLButtonElement;
const modalReplayBtn = document.getElementById('modalReplayBtn') as HTMLButtonElement;
const modalHomeBtn = document.getElementById('modalHomeBtn') as HTMLButtonElement;

let toastTimeout: number | null = null;
function showToast(msg: string): void {
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Keyboard Filtering Helper
function filterInput(char: string): string | null {
  const upper = char.toUpperCase();
  // Allow A-Z, Ñ
  if (/^[A-ZÑ]$/.test(upper)) {
    return upper;
  }
  // Handle accented inputs
  const mapped = removeAccents(upper);
  if (/^[A-ZÑ]$/.test(mapped)) {
    if (tildesMode) {
      // In tildes mode, if they typed a Spanish accented letter, keep it
      if (/[ÁÉÍÓÚ]/.test(upper)) return upper;
      return mapped;
    } else {
      // Strip accents immediately in normal mode
      return mapped;
    }
  }
  return null;
}

// Setup Hidden Input listeners for Mobile & Keyboard Capture
function setupInputHandlers(): void {
  // Focus hidden input when clicking anywhere on the board
  board.addEventListener('click', () => {
    if (!isGameOver) hiddenInput.focus();
  });

  hiddenInput.addEventListener('input', () => {
    if (isGameOver) {
      hiddenInput.value = '';
      return;
    }
    const val = hiddenInput.value;
    if (val.length > 0) {
      const lastChar = val[val.length - 1];
      const filtered = filterInput(lastChar);
      if (filtered) {
        const maxLen = hiddenLengthMode ? 10 : secretWord.length;
        if (currentGuess.length < maxLen) {
          currentGuess += filtered;
          renderBoard();
        }
      }
      hiddenInput.value = ''; // Reset input buffer
    }
  });

  // Keyboard backspace and enter captures
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isGameOver || document.activeElement === menuSeedInput) return;

    if (e.key === 'Backspace') {
      if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        renderBoard();
      }
      e.preventDefault();
    } else if (e.key === 'Enter') {
      submitGuess();
      e.preventDefault();
    } else if (e.key.length === 1) {
      // Standard physical typing backup
      const filtered = filterInput(e.key);
      if (filtered) {
        const maxLen = hiddenLengthMode ? 10 : secretWord.length;
        if (currentGuess.length < maxLen) {
          currentGuess += filtered;
          renderBoard();
        }
      }
      e.preventDefault();
    }
  });
}

// Stubs for lifecycle and timer (to be implemented fully in Task 7)
function loadNextWord(): void {}
function stopTimer(): void {}
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderBoard(): void {
  board.innerHTML = '';
  
  // 1. Render historical guesses
  guesses.forEach((guess) => {
    const row = document.createElement('div');
    row.className = 'row-guess';
    const colors = evaluateGuessColors(guess);
    
    for (let i = 0; i < guess.length; i++) {
      const tile = document.createElement('div');
      tile.className = `tile ${colors[i]}`;
      tile.textContent = guess[i];
      
      // Letroso boundary indicators
      if (hiddenLengthMode) {
        if (i === 0 && guess[0] === secretWord[0]) {
          tile.classList.add('is-initial');
        }
        if (i === guess.length - 1 && guess[guess.length - 1] === secretWord[secretWord.length - 1]) {
          tile.classList.add('is-final');
        }
      }
      row.appendChild(tile);
    }
    board.appendChild(row);
  });

  // 2. Render current active guess row
  if (!isGameOver) {
    const activeRow = document.createElement('div');
    activeRow.className = 'row-guess';
    
    const lengthToDraw = hiddenLengthMode ? Math.max(4, currentGuess.length) : secretWord.length;
    for (let i = 0; i < lengthToDraw; i++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      if (i < currentGuess.length) {
        tile.textContent = currentGuess[i];
        tile.classList.add('pop'); // Trigger CSS scaling
      } else {
        tile.textContent = '';
      }
      activeRow.appendChild(tile);
    }
    board.appendChild(activeRow);
  }
  
  // Auto-scroll to bottom of container
  attemptsContainer.scrollTop = attemptsContainer.scrollHeight;
  wordStatusLabel.textContent = `Intentos: ${guesses.length}`;
}

// Exact Coloring Evaluation Algorithm
function evaluateGuessColors(guess: string): string[] {
  const n = guess.length;
  const m = secretWord.length;
  const colors = new Array<string>(n).fill('absent');
  
  let isInitialMatched = false;
  let isFinalMatched = false;

  // First letter boundary match (Letroso style)
  if (hiddenLengthMode && guess[0] === secretWord[0]) {
    colors[0] = 'correct';
    isInitialMatched = true;
  }
  // Last letter boundary match (Letroso style)
  if (hiddenLengthMode && guess[n - 1] === secretWord[m - 1]) {
    colors[n - 1] = 'correct';
    isFinalMatched = true;
  }

  // Standard position matches (Greens)
  for (let i = 0; i < Math.min(n, m); i++) {
    if (i === 0 && isInitialMatched) continue;
    if (i === n - 1 && isFinalMatched) continue;
    if (guess[i] === secretWord[i]) {
      colors[i] = 'correct';
    }
  }

  // Remaining pool of characters in secret word
  const pool: string[] = [];
  for (let i = 0; i < m; i++) {
    let isMatchedGreen = false;
    if (i === 0 && isInitialMatched) isMatchedGreen = true;
    if (i === m - 1 && isFinalMatched) isMatchedGreen = true;
    if (!isMatchedGreen && i < n && guess[i] === secretWord[i]) isMatchedGreen = true;
    
    if (!isMatchedGreen) {
      pool.push(secretWord[i]);
    }
  }

  // Character existence matches (Yellows)
  for (let i = 0; i < n; i++) {
    if (colors[i] === 'correct') continue;
    const char = guess[i];
    const poolIdx = pool.indexOf(char);
    if (poolIdx !== -1) {
      colors[i] = 'present';
      pool.splice(poolIdx, 1);
    }
  }

  return colors;
}

function submitGuess(): void {
  if (isGameOver) return;
  
  const minLen = hiddenLengthMode ? 4 : secretWord.length;
  if (currentGuess.length < minLen) {
    showToast(`La palabra debe tener al menos ${minLen} letras`);
    return;
  }
  
  if (!isValidWord(currentGuess)) {
    showToast('No está en el diccionario');
    return;
  }
  
  // Add guess and reset input
  guesses.push(currentGuess);
  const lastGuess = currentGuess;
  currentGuess = '';
  
  renderBoard();

  // Check Win
  if (lastGuess === secretWord) {
    handleWin();
  }
}

function handleWin(): void {
  isGameOver = true;
  if (timeTrialMode) {
    score++;
    scoreCount.textContent = String(score);
    showToast('¡Correcto! Siguiente palabra...');
    setTimeout(() => {
      loadNextWord();
    }, 1000);
  } else {
    stopTimer();
    modalTitle.textContent = '¡Victoria!';
    modalDesc.textContent = `Adivinaste la palabra secreta "${secretWord}" en ${guesses.length} intentos y ${formatTime(elapsedTime)}.`;
    modalNextBtn.classList.add('hidden');
    modalReplayBtn.classList.remove('hidden');
    endGameOverlay.classList.add('show');
  }
}

// Initialize selector headers
createHeader({ showBackButton: true, title: 'Palabra del Día' });
setupInputHandlers();

// Temporary dummy function to satisfy compiler flags for unused variables
export function __dummyUnusedLocalsReference(): void {
  console.log({
    seedNum,
    prng,
    guesses,
    timeTrialMode,
    timerId,
    startTime,
    elapsedTime,
    timeTrialRemaining,
    score,
    wordStartTime,
    startMenu,
    gameArea,
    menuTildesCheck,
    menuHiddenLengthCheck,
    menuTimeTrialCheck,
    startGameBtn,
    seedLabel,
    scoreLabel,
    scoreCount,
    gameModeTags,
    attemptsContainer,
    skipWordBtn,
    revealWordBtn,
    restartGameBtn,
    exitToMenuBtn,
    timerEl,
    wordStatusLabel,
    endGameOverlay,
    modalTitle,
    modalDesc,
    modalNextBtn,
    modalReplayBtn,
    modalHomeBtn,
    showToast,
    mulberry32,
    parseSeed,
    randomSeed,
    getSeededWord,
    isValidWord
  });
}
