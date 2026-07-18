import { createHeader } from '@sourceplay/shared';
import { generateWordSearch, WordSearchBoard } from './core';
import { randomSeed } from './rng';

// Constants
const DIFFICULTIES: Record<string, { label: string; size: number }> = {
  facil: { label: 'Fácil', size: 8 },
  medio: { label: 'Medio', size: 10 },
  dificil: { label: 'Difícil', size: 12 },
  experto: { label: 'Experto', size: 14 }
};
const DIFFICULTY_ORDER = ['facil', 'medio', 'dificil', 'experto'];

// Game State variables
let currentDifficulty = 'medio';
let activeBoard: WordSearchBoard | null = null;
let foundWords = new Set<string>();
let timerId: number | null = null;
let startTime = 0;
let elapsedTime = 0;

// Selection state
let isDragging = false;
let startCell: { x: number; y: number } | null = null;
let currentCell: { x: number; y: number } | null = null;

// DOM Elements
const startMenuView = document.getElementById('startMenu') as HTMLDivElement;
const gameAreaView = document.getElementById('gameArea') as HTMLDivElement;
const menuDiffGrid = document.getElementById('menuDiffGrid') as HTMLDivElement;
const menuSeedInput = document.getElementById('menuSeedInput') as HTMLInputElement;
const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
const boardEl = document.getElementById('board') as HTMLDivElement;
const wordListEl = document.getElementById('wordList') as HTMLDivElement;
const seedLabelEl = document.getElementById('seedLabel') as HTMLElement;
const diffTagEl = document.getElementById('diffTag') as HTMLElement;
const progressLabelEl = document.getElementById('progressLabel') as HTMLElement;
const timerEl = document.getElementById('timer') as HTMLElement;
const restartGameBtn = document.getElementById('restartGameBtn') as HTMLButtonElement;
const exitToMenuBtn = document.getElementById('exitToMenuBtn') as HTMLButtonElement;
const toastEl = document.getElementById('toast') as HTMLDivElement;

// Confirm Overlay elements
const confirmOverlay = document.getElementById('confirmOverlay') as HTMLDivElement;
const confirmCancelBtn = document.getElementById('confirmCancelBtn') as HTMLButtonElement;
const confirmOkBtn = document.getElementById('confirmOkBtn') as HTMLButtonElement;
let onConfirmCallback: (() => void) | null = null;

// Win Overlay elements
const winOverlay = document.getElementById('winOverlay') as HTMLDivElement;
const winStatsEl = document.getElementById('winStats') as HTMLParagraphElement;
const winReplayBtn = document.getElementById('winReplayBtn') as HTMLButtonElement;

// Initialize shared header
createHeader({ showBackButton: true });

// Draw difficulty buttons
function initMenu(): void {
  menuDiffGrid.innerHTML = '';
  DIFFICULTY_ORDER.forEach((key) => {
    const btn = document.createElement('button');
    btn.className = 'diff-vertical-btn';
    btn.innerHTML = `${DIFFICULTIES[key].label} <span class="size-hint">${DIFFICULTIES[key].size}x${DIFFICULTIES[key].size}</span>`;
    btn.dataset.key = key;
    if (key === currentDifficulty) btn.classList.add('active');
    
    btn.addEventListener('click', () => {
      const btns = menuDiffGrid.querySelectorAll('.diff-vertical-btn');
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDifficulty = key;
    });
    menuDiffGrid.appendChild(btn);
  });
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function startTimer(): void {
  stopTimer();
  startTime = Date.now() - elapsedTime * 1000;
  timerId = window.setInterval(() => {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = formatTime(elapsedTime);
  }, 1000);
}

function stopTimer(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

let toastTimeout: number | null = null;
function showToast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  if (toastTimeout !== null) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2000);
}

startGameBtn.addEventListener('click', () => {
  let seed = menuSeedInput.value.trim();
  if (!seed) seed = String(randomSeed());
  setupGame(currentDifficulty, seed);
});

function setupGame(difficulty: string, seed: string): void {
  activeBoard = generateWordSearch(difficulty, seed);
  foundWords.clear();
  const overlaysSvg = document.getElementById('overlays-svg') as SVGSVGElement | null;
  if (overlaysSvg) {
    overlaysSvg.innerHTML = '';
  }
  elapsedTime = 0;
  timerEl.textContent = '00:00';
  startTimer();

  // Reset selection state
  startCell = null;
  currentCell = null;
  isDragging = false;

  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach(c => {
    c.classList.remove('start-cell');
    c.classList.remove('selecting');
  });

  seedLabelEl.textContent = seed;
  diffTagEl.textContent = DIFFICULTIES[difficulty].label;

  renderBoard();
  renderWordList();
  updateProgress();

  startMenuView.classList.add('hidden');
  gameAreaView.classList.remove('hidden');
}

function renderBoard(): void {
  if (!activeBoard) return;
  const { grid, difficulty } = activeBoard;
  const size = DIFFICULTIES[difficulty].size;

  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);

      const letterSpan = document.createElement('span');
      letterSpan.className = 'letter';
      letterSpan.textContent = grid[y][x];
      cell.appendChild(letterSpan);

      boardEl.appendChild(cell);
    }
  }
  setupInteraction();
}

function renderWordList(): void {
  if (!activeBoard) return;
  wordListEl.innerHTML = '';
  activeBoard.words.forEach(word => {
    const el = document.createElement('span');
    el.className = 'word-item';
    el.id = `word-item-${word}`;
    el.textContent = word;
    wordListEl.appendChild(el);
  });
}

function updateProgress(): void {
  if (!activeBoard) return;
  progressLabelEl.textContent = `${foundWords.size} / ${activeBoard.words.length}`;
}

// Helpers for selection coordinate alignment
function getCoord(el: HTMLElement) {
  return {
    x: parseInt(el.dataset.x || '0', 10),
    y: parseInt(el.dataset.y || '0', 10)
  };
}

function getCellAt(x: number, y: number): HTMLDivElement | null {
  return boardEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

function getPathCells(
  start: { x: number; y: number },
  end: { x: number; y: number }
): { x: number; y: number }[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);

  // Validate straight horizontal, vertical or 45-degree diagonal
  if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
    return [];
  }

  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const path = [];
  for (let i = 0; i <= steps; i++) {
    path.push({
      x: start.x + i * stepX,
      y: start.y + i * stepY
    });
  }
  return path;
}

function updateSelectingHighlight(): void {
  const cells = boardEl.querySelectorAll('.cell') as NodeListOf<HTMLDivElement>;
  cells.forEach(c => c.classList.remove('selecting'));
  if (startCell && currentCell) {
    const path = getPathCells(startCell, currentCell);
    path.forEach(pt => {
      const el = getCellAt(pt.x, pt.y);
      if (el) el.classList.add('selecting');
    });
  }
}

function handleStart(cell: HTMLDivElement): void {
  const coord = getCoord(cell);
  const cells = boardEl.querySelectorAll('.cell') as NodeListOf<HTMLDivElement>;
  if (startCell && !isDragging) {
    // Fallback Click Selection - second tap
    const path = getPathCells(startCell, coord);
    if (path.length > 1) {
      commitSelection(path);
      startCell = null;
      currentCell = null;
    } else {
      // If second tap is not aligned, make it the new start cell
      cells.forEach(c => c.classList.remove('start-cell'));
      startCell = coord;
      cell.classList.add('start-cell');
    }
  } else {
    // Initial drag selection or single start cell tap
    isDragging = true;
    startCell = coord;
    currentCell = coord;
    cells.forEach(c => c.classList.remove('start-cell'));
    cell.classList.add('start-cell');
    updateSelectingHighlight();
  }
}

function handleMove(cell: HTMLDivElement): void {
  if (!isDragging || !startCell) return;
  const coord = getCoord(cell);
  if (currentCell && currentCell.x === coord.x && currentCell.y === coord.y) return;
  currentCell = coord;
  updateSelectingHighlight();
}

function handleEnd(): void {
  if (!isDragging) return;
  isDragging = false;
  const cells = boardEl.querySelectorAll('.cell') as NodeListOf<HTMLDivElement>;
  if (startCell && currentCell) {
    const path = getPathCells(startCell, currentCell);
    if (path.length > 1) {
      commitSelection(path);
      startCell = null;
      currentCell = null;
    } else {
      // Keep start cell highlighted for the dual click fallback
      cells.forEach(c => c.classList.remove('selecting'));
    }
  }
}

function setupInteraction(): void {
  if (!activeBoard) return;
  const cells = boardEl.querySelectorAll('.cell') as NodeListOf<HTMLDivElement>;

  cells.forEach(cell => {
    cell.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cell.releasePointerCapture(e.pointerId); // Enable moves over other elements
      handleStart(cell);
    });

    cell.addEventListener('pointerenter', () => {
      handleMove(cell);
    });
  });
}

function commitSelection(path: { x: number; y: number }[]): void {
  if (!activeBoard) return;
  const { grid, words } = activeBoard;

  let selectedWord = '';
  path.forEach(pt => {
    selectedWord += grid[pt.y][pt.x];
  });

  const reversedWord = selectedWord.split('').reverse().join('');
  let matchedWord = '';

  if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
    matchedWord = selectedWord;
  } else if (words.includes(reversedWord) && !foundWords.has(reversedWord)) {
    matchedWord = reversedWord;
  }

  const cells = boardEl.querySelectorAll('.cell') as NodeListOf<HTMLDivElement>;
  cells.forEach(c => {
    c.classList.remove('selecting');
    c.classList.remove('start-cell');
  });

  if (matchedWord) {
    foundWords.add(matchedWord);
    showToast(`¡Encontrado: ${matchedWord}!`);

    // Draw the SVG overlay line for the found word
    drawWordOverlay(path, matchedWord);

    // Apply permanent highlighting
    path.forEach(pt => {
      const el = boardEl.querySelector(`.cell[data-x="${pt.x}"][data-y="${pt.y}"]`);
      if (el) el.classList.add('selected-word');
    });

    // Strike through word item
    const itemEl = document.getElementById(`word-item-${matchedWord}`);
    if (itemEl) itemEl.classList.add('found');

    updateProgress();

    // Check win condition
    if (foundWords.size === words.length) {
      triggerWin();
    }
  }
}

function triggerWin(): void {
  stopTimer();
  winStatsEl.textContent = `Has completado la sopa en ${formatTime(elapsedTime)}.`;
  winOverlay.classList.add('show');
}

winReplayBtn.addEventListener('click', () => {
  winOverlay.classList.remove('show');
  startMenuView.classList.remove('hidden');
  gameAreaView.classList.add('hidden');
  menuSeedInput.value = '';
});

// Common Confirm modal helper
function askConfirmation(title: string, desc: string, callback: () => void): void {
  onConfirmCallback = callback;
  document.getElementById('confirmTitle')!.textContent = title;
  document.getElementById('confirmDesc')!.textContent = desc;
  confirmOverlay.classList.add('show');
}

confirmCancelBtn.addEventListener('click', () => {
  confirmOverlay.classList.remove('show');
  onConfirmCallback = null;
});

confirmOkBtn.addEventListener('click', () => {
  confirmOverlay.classList.remove('show');
  if (onConfirmCallback) {
    onConfirmCallback();
    onConfirmCallback = null;
  }
});

// Game action listeners
restartGameBtn.addEventListener('click', () => {
  askConfirmation('¿Reiniciar partida?', 'Se borrarán todas las palabras encontradas y se reiniciará el cronómetro.', () => {
    if (activeBoard) {
      setupGame(activeBoard.difficulty, activeBoard.seed);
    }
  });
});

exitToMenuBtn.addEventListener('click', () => {
  askConfirmation('¿Salir al menú?', 'Perderás el progreso de la partida actual.', () => {
    stopTimer();
    startMenuView.classList.remove('hidden');
    gameAreaView.classList.add('hidden');
  });
});

// Global touch/pointer handlers registered once
boardEl.addEventListener('touchmove', (e) => {
  if (!isDragging || !startCell) return;
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
  const cell = target?.closest('.cell') as HTMLDivElement | null;
  if (cell) handleMove(cell);
}, { passive: true });

window.addEventListener('pointerup', handleEnd);
window.addEventListener('pointercancel', handleEnd);

window.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('#board') && !target.closest('.diff-vertical-btn') && !target.closest('.btn') && !target.closest('#menuSeedInput')) {
    startCell = null;
    currentCell = null;
    const cells = boardEl.querySelectorAll('.cell');
    cells.forEach(c => {
      c.classList.remove('start-cell');
      c.classList.remove('selecting');
    });
  }
});

function drawWordOverlay(path: { x: number; y: number }[], word: string): void {
  if (!activeBoard) return;
  const overlaysSvg = document.getElementById('overlays-svg') as SVGSVGElement | null;
  if (!overlaysSvg) return;

  const size = DIFFICULTIES[activeBoard.difficulty].size;
  const cellUnit = 1000 / size;

  const startCell = path[0];
  const endCell = path[path.length - 1];

  const x1 = cellUnit * (startCell.x + 0.5);
  const y1 = cellUnit * (startCell.y + 0.5);
  const x2 = cellUnit * (endCell.x + 0.5);
  const y2 = cellUnit * (endCell.y + 0.5);

  const strokeWidth = cellUnit * 0.76;

  const wordIndex = activeBoard.words.indexOf(word);
  const hues = [340, 25, 50, 95, 140, 175, 205, 230, 265, 295];
  const hue = hues[wordIndex % hues.length];

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke-width', String(strokeWidth));
  line.setAttribute('stroke-linecap', 'round');
  line.style.setProperty('--word-hue', String(hue));
  line.id = `overlay-line-${word}`;

  overlaysSvg.appendChild(line);
}

// Run menu init
initMenu();
