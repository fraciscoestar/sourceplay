import { createHeader } from '@sourceplay/shared';
import { mulberry32, parseSeed, randomSeed } from './rng';
import { getSeededWord, isTooShort, isValidWord, removeAccents } from './words';

// State
let customSeed: number = 0;
let gameCount: number = 0;
let seedNum: number = 0;
let prng: () => number = () => 0;
let secretWord: string = '';
let currentGuess: string = '';
let guesses: string[] = [];
let isGameOver: boolean = true;
let selectedIndex: number = 0;

// Options
let tildesMode: boolean = false;
let hiddenLengthMode: boolean = false;
let timeTrialMode: boolean = false;

// Timer & Scores
let timerId: number | null = null;
let transitionTimeoutId: number | null = null;
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
const keyboardEl = document.getElementById('keyboard') as HTMLDivElement;

const keyStatuses = new Map<string, 'correct' | 'present' | 'absent'>();

const submitGuessBtn = document.getElementById('submitGuessBtn') as HTMLButtonElement;
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

const surrenderModal = document.getElementById('surrenderModal') as HTMLDivElement;
const surrenderCancelBtn = document.getElementById('surrenderCancelBtn') as HTMLButtonElement;
const surrenderConfirmBtn = document.getElementById('surrenderConfirmBtn') as HTMLButtonElement;

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

function insertCharacter(char: string): void {
  if (isGameOver) return;

  if (hiddenLengthMode) {
    let chars = currentGuess.split('');
    if (selectedIndex < chars.length) {
      chars[selectedIndex] = char;
    } else if (chars.length < 10) {
      chars.push(char);
      selectedIndex = chars.length;
    }
    currentGuess = chars.join('');
  } else {
    const maxLen = secretWord.length;
    let chars = currentGuess.split('');
    while (chars.length < maxLen) chars.push(' ');
    chars[selectedIndex] = char;
    // Advance selectedIndex to next empty tile
    let nextEmpty = chars.findIndex((c, i) => i > selectedIndex && (c === ' ' || c === ''));
    if (nextEmpty !== -1) {
      selectedIndex = nextEmpty;
    } else if (selectedIndex < maxLen - 1) {
      selectedIndex++;
    }
    currentGuess = chars.join('').trimEnd();
  }
  renderBoard();
}

function handleBackspace(): void {
  if (isGameOver) return;
  
  if (hiddenLengthMode) {
    if (currentGuess.length === 0) return;
    let chars = currentGuess.split('');
    if (selectedIndex < chars.length) {
      chars.splice(selectedIndex, 1);
      if (selectedIndex > 0 && selectedIndex >= chars.length) {
        selectedIndex = chars.length - 1;
      }
    } else {
      chars.pop();
      selectedIndex = Math.max(0, chars.length);
    }
    currentGuess = chars.join('');
  } else {
    let chars = currentGuess.split('');
    const maxLen = secretWord.length;
    while (chars.length < maxLen) chars.push(' ');
    
    if (chars[selectedIndex] && chars[selectedIndex] !== ' ') {
      chars[selectedIndex] = ' ';
    } else if (selectedIndex > 0) {
      selectedIndex--;
      chars[selectedIndex] = ' ';
    }
    currentGuess = chars.join('').trimEnd();
  }
  renderBoard();
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
        insertCharacter(filtered);
      }
      hiddenInput.value = ''; // Reset input buffer
    }
  });

  // Keyboard backspace, enter, and arrow captures
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isGameOver || document.activeElement === menuSeedInput) return;

    if (e.key === 'Backspace') {
      handleBackspace();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      submitGuess();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      if (selectedIndex > 0) {
        selectedIndex--;
        renderBoard();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      const maxLen = hiddenLengthMode ? currentGuess.length : secretWord.length - 1;
      if (selectedIndex < maxLen) {
        selectedIndex++;
        renderBoard();
      }
      e.preventDefault();
    } else if (e.key.length === 1) {
      // If mobile hidden input has focus, let the input event handle it to prevent blocking virtual keyboard
      if (document.activeElement === hiddenInput) return;
      // Standard physical typing backup
      const filtered = filterInput(e.key);
      if (filtered) {
        insertCharacter(filtered);
      }
      e.preventDefault();
    }
  });
}

// Game Lifecycle & Timers
function startNewGame(fromMenu: boolean = false): void {
  // Read config
  tildesMode = menuTildesCheck.checked;
  hiddenLengthMode = menuHiddenLengthCheck.checked;
  timeTrialMode = menuTimeTrialCheck.checked;
  
  if (fromMenu) {
    const rawSeed = menuSeedInput.value.trim() || String(randomSeed());
    customSeed = parseSeed(rawSeed);
    gameCount = 0;
    seedLabel.textContent = '#' + rawSeed;
  } else {
    gameCount++;
  }

  seedNum = (customSeed + gameCount) >>> 0;
  prng = mulberry32(seedNum);
  
  guesses = [];
  currentGuess = '';
  selectedIndex = 0;
  isGameOver = false;
  score = 0;
  elapsedTime = 0;
  timeTrialRemaining = 300;
  
  // UI setup
  scoreCount.textContent = '0';
  if (timeTrialMode) {
    scoreLabel.classList.remove('hidden');
    skipWordBtn.classList.remove('hidden');
    revealWordBtn.classList.add('hidden');
  } else {
    scoreLabel.classList.add('hidden');
    skipWordBtn.classList.add('hidden');
    revealWordBtn.classList.remove('hidden');
  }
  
  // Render tags
  gameModeTags.innerHTML = '';
  if (tildesMode) gameModeTags.innerHTML += '<span class="tag">Tildes</span>';
  if (hiddenLengthMode) gameModeTags.innerHTML += '<span class="tag">Oculto</span>';
  if (timeTrialMode) gameModeTags.innerHTML += '<span class="tag">Contrarreloj</span>';
  if (!tildesMode && !hiddenLengthMode && !timeTrialMode) gameModeTags.innerHTML += '<span class="tag">Normal</span>';

  // Transition views
  startMenu.classList.add('hidden');
  gameArea.classList.remove('hidden');
  endGameOverlay.classList.remove('show');
  if (surrenderModal) surrenderModal.classList.remove('show');
  
  // Load first word
  loadNextWord();
  
  // Start timers
  startTimer();
  
  // Set focus
  setTimeout(() => hiddenInput.focus(), 50);
}

function startGame(): void {
  startNewGame(true);
}

function handleVirtualKeyPress(k: string): void {
  if (isGameOver) return;
  if (k === 'ENTER') {
    submitGuess();
  } else if (k === '⌫') {
    handleBackspace();
  } else {
    const filtered = filterInput(k);
    if (filtered) {
      insertCharacter(filtered);
    }
  }
}

function renderKeyboard(): void {
  if (!keyboardEl) return;
  keyboardEl.innerHTML = '';
  const rows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ñ'],
    ['Z','X','C','V','B','N','M','⌫']
  ];
  if (tildesMode) {
    rows.push(['Á','É','Í','Ó','Ú']);
  }

  rows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    row.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key';
      if (k === 'ENTER' || k === '⌫') {
        btn.classList.add('key-wide');
      }
      btn.textContent = k;
      const status = keyStatuses.get(k);
      if (status) {
        btn.classList.add(status);
      }
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleVirtualKeyPress(k);
      });
      rowDiv.appendChild(btn);
    });
    keyboardEl.appendChild(rowDiv);
  });
}

function updateKeyboardColors(): void {
  guesses.forEach(g => {
    const colors = evaluateGuessColors(g);
    for (let i = 0; i < g.length; i++) {
      const char = g[i];
      const col = colors[i];
      const prev = keyStatuses.get(char);
      if (col === 'correct') {
        keyStatuses.set(char, 'correct');
      } else if (col === 'present' && prev !== 'correct') {
        keyStatuses.set(char, 'present');
      } else if (col === 'absent' && !prev) {
        keyStatuses.set(char, 'absent');
      }
    }
  });
  renderKeyboard();
}

function loadNextWord(): void {
  if (isGameOver) return;
  secretWord = getSeededWord(prng, tildesMode);
  guesses = [];
  currentGuess = '';
  selectedIndex = 0;
  isGameOver = false;
  wordStartTime = Date.now(); // track start time of this word
  keyStatuses.clear();
  renderBoard();
  renderKeyboard();
}

function startTimer(): void {
  stopTimer();
  startTime = Date.now();
  timerId = window.setInterval(() => {
    if (timeTrialMode) {
      timeTrialRemaining--;
      if (timeTrialRemaining <= 0) {
        timeTrialRemaining = 0;
        handleTimeTrialEnd();
      }
      timerEl.textContent = formatTime(timeTrialRemaining);
    } else {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      timerEl.textContent = formatTime(elapsedTime);
    }
  }, 1000);
  timerEl.textContent = formatTime(timeTrialMode ? timeTrialRemaining : elapsedTime);
}

function stopTimer(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  if (transitionTimeoutId !== null) {
    clearTimeout(transitionTimeoutId);
    transitionTimeoutId = null;
  }
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Skip Penalty Mechanics
function handleSkipWord(): void {
  if (isGameOver) return;
  const elapsedOnWord = Math.floor((Date.now() - wordStartTime) / 1000);
  if (elapsedOnWord < 30) {
    const penalty = 30 - elapsedOnWord;
    timeTrialRemaining = Math.max(0, timeTrialRemaining - penalty);
    showToast(`¡Saltado! Penalización de -${penalty}s`);
    timerEl.textContent = formatTime(timeTrialRemaining);
    if (timeTrialRemaining <= 0) {
      handleTimeTrialEnd();
      return;
    }
  } else {
    showToast('¡Saltado!');
  }
  loadNextWord();
}

function handleRevealWord(): void {
  if (isGameOver) return;
  isGameOver = true;
  stopTimer();
  modalTitle.textContent = 'Partida Terminada';
  modalDesc.textContent = `La palabra secreta era "${secretWord}".`;
  modalNextBtn.classList.add('hidden');
  modalReplayBtn.classList.remove('hidden');
  endGameOverlay.classList.add('show');
}

function handleTimeTrialEnd(): void {
  isGameOver = true;
  stopTimer();
  modalTitle.textContent = '¡Tiempo Agotado!';
  modalDesc.textContent = `Adivinaste un total de ${score} palabras usando la semilla #${seedLabel.textContent?.slice(1)}.`;
  modalNextBtn.classList.add('hidden');
  modalReplayBtn.classList.remove('hidden');
  endGameOverlay.classList.add('show');
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
    activeRow.className = 'row-guess active-row';
    
    if (hiddenLengthMode) {
      if (selectedIndex > currentGuess.length) {
        selectedIndex = currentGuess.length;
      }
      const chars = currentGuess.split('');
      chars.forEach((ch, idx) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (ch && ch !== ' ') {
          tile.textContent = ch;
          tile.classList.add('pop'); // Trigger CSS scaling
        }
        if (idx === selectedIndex) {
          tile.classList.add('selected');
        }
        tile.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isGameOver) return;
          selectedIndex = idx;
          renderBoard();
          setTimeout(() => hiddenInput.focus(), 10);
        });
        activeRow.appendChild(tile);
      });
    } else {
      const targetLen = secretWord.length;
      if (selectedIndex >= targetLen) {
        selectedIndex = Math.max(0, targetLen - 1);
      }

      const chars = currentGuess.split('');
      while (chars.length < targetLen) {
        chars.push('');
      }
      
      chars.forEach((ch, idx) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (ch && ch !== ' ') {
          tile.textContent = ch;
          tile.classList.add('pop'); // Trigger CSS scaling
        } else {
          tile.textContent = '';
        }
        if (idx === selectedIndex) {
          tile.classList.add('selected');
        }
        tile.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isGameOver) return;
          selectedIndex = idx;
          renderBoard();
          setTimeout(() => hiddenInput.focus(), 10);
        });
        activeRow.appendChild(tile);
      });
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

  const cleanGuess = currentGuess.replace(/ /g, '');

  if (isTooShort(cleanGuess)) {
    showToast('Palabra demasiado corta (mínimo 4 letras)');
    return;
  }
  
  if (!hiddenLengthMode && (currentGuess.includes(' ') || currentGuess.length < secretWord.length)) {
    showToast(`La palabra debe tener ${secretWord.length} letras`);
    return;
  }
  
  if (!isValidWord(currentGuess)) {
    showToast('Palabra no encontrada en el diccionario');
    return;
  }
  
  // Add guess and reset input
  guesses.push(currentGuess);
  const lastGuess = currentGuess;
  currentGuess = '';
  selectedIndex = 0;
  
  renderBoard();
  updateKeyboardColors();

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
    transitionTimeoutId = window.setTimeout(() => {
      transitionTimeoutId = null;
      isGameOver = false;
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

// Setup main view buttons
startGameBtn.addEventListener('click', startGame);
submitGuessBtn.addEventListener('click', submitGuess);
skipWordBtn.addEventListener('click', handleSkipWord);
revealWordBtn.addEventListener('click', () => {
  if (!isGameOver) surrenderModal.classList.add('show');
});
surrenderCancelBtn.addEventListener('click', () => {
  surrenderModal.classList.remove('show');
});
surrenderConfirmBtn.addEventListener('click', () => {
  surrenderModal.classList.remove('show');
  handleRevealWord();
});
restartGameBtn.addEventListener('click', () => startNewGame(false));

exitToMenuBtn.addEventListener('click', () => {
  stopTimer();
  isGameOver = true;
  if (surrenderModal) surrenderModal.classList.remove('show');
  gameArea.classList.add('hidden');
  startMenu.classList.remove('hidden');
});

modalHomeBtn.addEventListener('click', () => {
  endGameOverlay.classList.remove('show');
  if (surrenderModal) surrenderModal.classList.remove('show');
  isGameOver = true;
  gameArea.classList.add('hidden');
  startMenu.classList.remove('hidden');
});

modalReplayBtn.addEventListener('click', () => {
  endGameOverlay.classList.remove('show');
  startNewGame(false);
});

// Initialize selector headers
createHeader({ showBackButton: true, title: 'Palabra del Día' });
setupInputHandlers();
