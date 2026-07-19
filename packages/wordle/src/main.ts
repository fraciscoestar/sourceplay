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

// Temporary stub for renderBoard and submitGuess
function renderBoard(): void {
  board.innerHTML = 'Foco aquí para escribir: ' + currentGuess;
}
function submitGuess(): void {}

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
