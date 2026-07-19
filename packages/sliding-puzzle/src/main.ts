import { createHeader } from '@sourceplay/shared';
import { parseSeed, randomSeed, mulberry32 } from './rng';
import { DifficultyKey, SIZES, generatePuzzle, getMovableTiles, isSolved } from './sliding-puzzle-core';

interface GameState {
  seedNum: number;
  seedLabel: string;
  difficulty: DifficultyKey;
  rows: number;
  cols: number;
  board: number[];              // Flat array representing the tiles (0 = empty)
  emptyIndex: number;           // Index of the empty space (0) in the board
  initialBoard: number[];       // Initial shuffled state for restart
  initialEmptyIndex: number;
  solved: boolean;
  moveCount: number;
  startTime: number;
  elapsedBeforeLoad: number;    // Accumulated time from loaded checkpoints
  history: number[][];          // Snapshots of the board (deep clones)
  historyIndex: number;         // Current position in history
}

interface Checkpoint {
  id: number;
  name: string;
  dateStr: string;
  board: number[];
  emptyIndex: number;
  initialBoard: number[];
  initialEmptyIndex: number;
  difficulty: DifficultyKey;
  seedNum: number;
  seedLabel: string;
  moveCount: number;
  elapsedTime: number;
  rows: number;
  cols: number;
}

const STORAGE_KEY = 'sourceplay-sliding-checkpoints';

let state: GameState | null = null;
let timerInterval: number | null = null;
let selectedDifficulty: DifficultyKey = 'medio';

// DOM elements
let startMenuEl: HTMLElement;
let gameAreaEl: HTMLElement;
let menuDiffGridEl: HTMLElement;
let menuSeedInputEl: HTMLInputElement;
let startGameBtnEl: HTMLButtonElement;
let seedLabelEl: HTMLElement;
let diffTagEl: HTMLElement;
let boardEl: HTMLElement;
let loadingVeilEl: HTMLElement;
let timerEl: HTMLElement;
let movesLabelEl: HTMLElement;

// Controls
let undoBtnEl: HTMLButtonElement;
let redoBtnEl: HTMLButtonElement;
let createCheckpointBtnEl: HTMLButtonElement;
let gameLoadCheckpointBtnEl: HTMLButtonElement;
let restartGameBtnEl: HTMLButtonElement;
let exitToMenuBtnEl: HTMLButtonElement;

// Toast
let toastEl: HTMLElement;

// Modals
let createCheckpointOverlayEl: HTMLElement;
let checkpointNameInputEl: HTMLInputElement;
let cancelCreateCheckpointBtnEl: HTMLButtonElement;
let saveCheckpointBtnEl: HTMLButtonElement;

let loadCheckpointOverlayEl: HTMLElement;
let checkpointListEl: HTMLElement;
let closeLoadCheckpointBtnEl: HTMLButtonElement;

let confirmOverlayEl: HTMLElement;
let confirmTitleEl: HTMLElement;
let confirmDescEl: HTMLElement;
let confirmCancelBtnEl: HTMLButtonElement;
let confirmOkBtnEl: HTMLButtonElement;
let confirmCallback: (() => void) | null = null;

let winOverlayEl: HTMLElement;
let winStatsEl: HTMLElement;
let winReplayBtnEl: HTMLButtonElement;

/**
 * Initialize DOM element references and event listeners
 */
function initGame(): void {
  // Inject global shared header with back-button enabled
  createHeader({ showBackButton: true, title: 'Rompecabezas' });

  // Views
  startMenuEl = document.getElementById('startMenu')!;
  gameAreaEl = document.getElementById('gameArea')!;
  menuDiffGridEl = document.getElementById('menuDiffGrid')!;
  menuSeedInputEl = document.getElementById('menuSeedInput') as HTMLInputElement;
  startGameBtnEl = document.getElementById('startGameBtn') as HTMLButtonElement;

  // Labels / Stats
  seedLabelEl = document.getElementById('seedLabel')!;
  diffTagEl = document.getElementById('diffTag')!;
  boardEl = document.getElementById('board')!;
  loadingVeilEl = document.getElementById('loadingVeil')!;
  timerEl = document.getElementById('timer')!;
  movesLabelEl = document.getElementById('movesLabel')!;

  // Actions
  undoBtnEl = document.getElementById('undoBtn') as HTMLButtonElement;
  redoBtnEl = document.getElementById('redoBtn') as HTMLButtonElement;
  createCheckpointBtnEl = document.getElementById('createCheckpointBtn') as HTMLButtonElement;
  gameLoadCheckpointBtnEl = document.getElementById('gameLoadCheckpointBtn') as HTMLButtonElement;
  restartGameBtnEl = document.getElementById('restartGameBtn') as HTMLButtonElement;
  exitToMenuBtnEl = document.getElementById('exitToMenuBtn') as HTMLButtonElement;

  // Notification Toast
  toastEl = document.getElementById('toast')!;

  // Checkpoints
  createCheckpointOverlayEl = document.getElementById('createCheckpointOverlay')!;
  checkpointNameInputEl = document.getElementById('checkpointNameInput') as HTMLInputElement;
  cancelCreateCheckpointBtnEl = document.getElementById('cancelCreateCheckpointBtn') as HTMLButtonElement;
  saveCheckpointBtnEl = document.getElementById('saveCheckpointBtn') as HTMLButtonElement;

  loadCheckpointOverlayEl = document.getElementById('loadCheckpointOverlay')!;
  checkpointListEl = document.getElementById('checkpointList')!;
  closeLoadCheckpointBtnEl = document.getElementById('closeLoadCheckpointBtn') as HTMLButtonElement;

  // Confirm
  confirmOverlayEl = document.getElementById('confirmOverlay')!;
  confirmTitleEl = document.getElementById('confirmTitle')!;
  confirmDescEl = document.getElementById('confirmDesc')!;
  confirmCancelBtnEl = document.getElementById('confirmCancelBtn') as HTMLButtonElement;
  confirmOkBtnEl = document.getElementById('confirmOkBtn') as HTMLButtonElement;

  // Win
  winOverlayEl = document.getElementById('winOverlay')!;
  winStatsEl = document.getElementById('winStats')!;
  winReplayBtnEl = document.getElementById('winReplayBtn') as HTMLButtonElement;

  buildDifficultySelector();
  setupEventListeners();
  updateLoadCheckpointButtonState();
}

/**
 * Build the vertical difficulty button grid
 */
function buildDifficultySelector(): void {
  menuDiffGridEl.innerHTML = '';
  (Object.keys(SIZES) as DifficultyKey[]).forEach((key) => {
    const btn = document.createElement('button');
    btn.className = `diff-vertical-btn ${key === selectedDifficulty ? 'active' : ''}`;
    btn.textContent = SIZES[key].label;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-vertical-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = key;
    });
    menuDiffGridEl.appendChild(btn);
  });
}

/**
 * Show a notification toast
 */
function showToast(message: string): void {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

/**
 * Show custom confirm modal
 */
function showConfirmModal(title: string, desc: string, onConfirm: () => void): void {
  confirmTitleEl.textContent = title;
  confirmDescEl.textContent = desc;
  confirmCallback = onConfirm;
  confirmOverlayEl.classList.add('show');
}

/**
 * Hide confirm modal
 */
function hideConfirmModal(): void {
  confirmOverlayEl.classList.remove('show');
  confirmCallback = null;
}

/**
 * Starts the timer interval
 */
function startTimer(): void {
  if (timerInterval) clearInterval(timerInterval);
  state!.startTime = Date.now();
  timerInterval = window.setInterval(updateTimerDisplay, 1000);
}

/**
 * Stops the timer interval
 */
function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Updates the timer DOM element with the formatted duration
 */
function updateTimerDisplay(): void {
  if (!state) return;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
  timerEl.textContent = formatTime(elapsed);
}

/**
 * Helper to format seconds as MM:SS
 */
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Start game flow from menu inputs
 */
function handleStartGame(): void {
  const seedInput = menuSeedInputEl.value.trim();
  const seedNum = seedInput ? parseSeed(seedInput) : randomSeed();
  const seedLabel = seedInput ? seedInput : seedNum.toString();

  clearCheckpoints(); // Checkpoints are per-session/per-game
  newGame(selectedDifficulty, seedNum, seedLabel);
}

/**
 * Creates and starts a new game with selected configuration
 */
function newGame(diffKey: DifficultyKey, seedNum: number, seedLabel: string): void {
  const config = SIZES[diffKey];
  
  // Show loading veil while generating (similar to Sudoku)
  startMenuEl.classList.add('hidden');
  gameAreaEl.classList.remove('hidden');
  loadingVeilEl.classList.add('show');

  setTimeout(() => {
    const rng = mulberry32(seedNum);
    const { board, emptyIndex } = generatePuzzle(config.rows, config.cols, config.shuffleMoves, rng);

    state = {
      seedNum,
      seedLabel,
      difficulty: diffKey,
      rows: config.rows,
      cols: config.cols,
      board: [...board],
      emptyIndex,
      initialBoard: [...board],
      initialEmptyIndex: emptyIndex,
      solved: false,
      moveCount: 0,
      startTime: 0,
      elapsedBeforeLoad: 0,
      history: [[...board]],
      historyIndex: 0
    };

    loadingVeilEl.classList.remove('show');
    
    // Set grid properties
    boardEl.style.setProperty('--cols', state.cols.toString());
    boardEl.style.setProperty('--rows', state.rows.toString());
    boardEl.style.setProperty('--aspect', `${state.cols} / ${state.rows}`);

    seedLabelEl.textContent = seedLabel;
    diffTagEl.textContent = SIZES[diffKey].label.split(' ')[0]; // Just the difficulty word

    renderBoard();
    updateHistoryButtons();
    movesLabelEl.textContent = `Movimientos: 0`;
    timerEl.textContent = '00:00';
    startTimer();
  }, 50);
}

/**
 * Renders the sliding puzzle board tiles
 */
function renderBoard(): void {
  if (!state) return;
  boardEl.innerHTML = '';
  
  const movableTiles = getMovableTiles(state.emptyIndex, state.rows, state.cols);

  state.board.forEach((val, idx) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    
    if (val === 0) {
      tile.classList.add('empty');
    } else {
      const tileValue = document.createElement('span');
      tileValue.className = 'tile-value';
      tileValue.textContent = val.toString();
      tile.appendChild(tileValue);

      // Check if this tile can slide
      if (movableTiles.includes(idx)) {
        tile.classList.add('movable');
        tile.addEventListener('click', () => {
          slideTile(idx);
        });
      }
    }

    boardEl.appendChild(tile);
  });
}

/**
 * Handle sliding a tile into the empty space
 */
function slideTile(tileIndex: number): void {
  if (!state || state.solved) return;

  const movableTiles = getMovableTiles(state.emptyIndex, state.rows, state.cols);
  if (!movableTiles.includes(tileIndex)) return;

  // Swap tiles
  state.board[state.emptyIndex] = state.board[tileIndex];
  state.board[tileIndex] = 0;
  state.emptyIndex = tileIndex;

  state.moveCount++;
  movesLabelEl.textContent = `Movimientos: ${state.moveCount}`;

  pushHistoryState();
  renderBoard();
  checkWin();
}

/**
 * Check if the board is solved and handle victory
 */
function checkWin(): void {
  if (!state) return;
  if (isSolved(state.board)) {
    state.solved = true;
    stopTimer();
    
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
    winStatsEl.innerHTML = `Completado en <b>${formatTime(elapsed)}</b> con <b>${state.moveCount} movimientos</b>.`;
    winOverlayEl.classList.add('show');
  }
}

/**
 * Push the current board configuration to history
 */
function pushHistoryState(): void {
  if (!state) return;
  // Truncate redo history
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push([...state.board]);
  
  if (state.history.length > 100) {
    state.history.shift();
  } else {
    state.historyIndex++;
  }
  updateHistoryButtons();
}

/**
 * Perform undo action
 */
function undoMove(): void {
  if (!state || state.historyIndex <= 0 || state.solved) return;
  
  state.historyIndex--;
  state.board = [...state.history[state.historyIndex]];
  state.emptyIndex = state.board.indexOf(0);
  
  renderBoard();
  updateHistoryButtons();
}

/**
 * Perform redo action
 */
function redoMove(): void {
  if (!state || state.historyIndex >= state.history.length - 1 || state.solved) return;
  
  state.historyIndex++;
  state.board = [...state.history[state.historyIndex]];
  state.emptyIndex = state.board.indexOf(0);
  
  renderBoard();
  updateHistoryButtons();
}

/**
 * Enable/disable undo/redo buttons
 */
function updateHistoryButtons(): void {
  if (!state) return;
  undoBtnEl.disabled = state.historyIndex <= 0 || state.solved;
  redoBtnEl.disabled = state.historyIndex >= state.history.length - 1 || state.solved;
}

/**
 * Checkpoints logic
 */
function getCheckpoints(): Checkpoint[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveCheckpoints(list: Checkpoint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  updateLoadCheckpointButtonState();
}

function updateLoadCheckpointButtonState(): void {
  const list = getCheckpoints();
  gameLoadCheckpointBtnEl.disabled = list.length === 0;
}

function clearCheckpoints(): void {
  localStorage.removeItem(STORAGE_KEY);
  updateLoadCheckpointButtonState();
}

function openCreateCheckpointModal(): void {
  if (!state || state.solved) return;
  const list = getCheckpoints();
  if (list.length >= 3) {
    showToast('Límite de checkpoints alcanzado (Máx 3).');
    return;
  }
  checkpointNameInputEl.value = '';
  createCheckpointOverlayEl.classList.add('show');
  checkpointNameInputEl.focus();
}

function handleSaveCheckpoint(): void {
  if (!state) return;
  const name = checkpointNameInputEl.value.trim() || `Partida ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  const list = getCheckpoints();
  if (list.length >= 3) {
    showToast('Límite de checkpoints alcanzado.');
    createCheckpointOverlayEl.classList.remove('show');
    return;
  }

  const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
  
  const newCp: Checkpoint = {
    id: Date.now(),
    name,
    dateStr: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    board: [...state.board],
    emptyIndex: state.emptyIndex,
    initialBoard: [...state.initialBoard],
    initialEmptyIndex: state.initialEmptyIndex,
    difficulty: state.difficulty,
    seedNum: state.seedNum,
    seedLabel: state.seedLabel,
    moveCount: state.moveCount,
    elapsedTime: elapsed,
    rows: state.rows,
    cols: state.cols
  };

  list.push(newCp);
  saveCheckpoints(list);
  
  createCheckpointOverlayEl.classList.remove('show');
  showToast('Checkpoint guardado con éxito.');
}

function openLoadCheckpointModal(): void {
  const list = getCheckpoints();
  if (list.length === 0) return;

  checkpointListEl.innerHTML = '';
  list.forEach((cp) => {
    const card = document.createElement('div');
    card.className = 'checkpoint-card';
    
    card.innerHTML = `
      <div class="checkpoint-card-header">
        <span class="checkpoint-card-name">${cp.name}</span>
        <span class="checkpoint-card-date">${cp.dateStr}</span>
      </div>
      <div class="checkpoint-card-details">
        Dificultad: ${SIZES[cp.difficulty].label.split(' ')[0]} | Movimientos: ${cp.moveCount} | Tiempo: ${formatTime(cp.elapsedTime)}
      </div>
      <div class="checkpoint-card-actions">
        <button class="checkpoint-btn primary" data-id="${cp.id}" data-action="load">Cargar</button>
        <button class="checkpoint-btn" data-id="${cp.id}" data-action="delete">Borrar</button>
      </div>
    `;

    checkpointListEl.appendChild(card);
  });

  loadCheckpointOverlayEl.classList.add('show');
}

function handleCheckpointAction(e: Event): void {
  const target = e.target as HTMLButtonElement;
  if (!target.classList.contains('checkpoint-btn')) return;

  const id = parseInt(target.getAttribute('data-id')!, 10);
  const action = target.getAttribute('data-action');
  
  if (action === 'load') {
    loadCheckpointOverlayEl.classList.remove('show');
    if (state && !state.solved) {
      showConfirmModal(
        '¿Cargar checkpoint?',
        'Se perderá el progreso de la partida actual no guardada.',
        () => performLoad(id)
      );
    } else {
      performLoad(id);
    }
  } else if (action === 'delete') {
    showConfirmModal(
      '¿Borrar checkpoint?',
      'Esta acción no se puede deshacer.',
      () => performDelete(id)
    );
  }
}

function performLoad(id: number): void {
  const list = getCheckpoints();
  const cp = list.find((item) => item.id === id);
  if (!cp) return;

  stopTimer();

  // Load state
  state = {
    seedNum: cp.seedNum,
    seedLabel: cp.seedLabel,
    difficulty: cp.difficulty,
    rows: cp.rows,
    cols: cp.cols,
    board: [...cp.board],
    emptyIndex: cp.emptyIndex,
    initialBoard: [...cp.initialBoard],
    initialEmptyIndex: cp.initialEmptyIndex,
    solved: false,
    moveCount: cp.moveCount,
    startTime: Date.now(),
    elapsedBeforeLoad: cp.elapsedTime,
    history: [[...cp.board]],
    historyIndex: 0
  };

  startMenuEl.classList.add('hidden');
  gameAreaEl.classList.remove('hidden');

  // Set grid properties
  boardEl.style.setProperty('--cols', state.cols.toString());
  boardEl.style.setProperty('--rows', state.rows.toString());
  boardEl.style.setProperty('--aspect', `${state.cols} / ${state.rows}`);

  seedLabelEl.textContent = cp.seedLabel;
  diffTagEl.textContent = SIZES[cp.difficulty].label.split(' ')[0];

  renderBoard();
  updateHistoryButtons();
  movesLabelEl.textContent = `Movimientos: ${state.moveCount}`;
  updateTimerDisplay();
  startTimer();

  showToast('Checkpoint cargado.');
}

function performDelete(id: number): void {
  let list = getCheckpoints();
  list = list.filter((item) => item.id !== id);
  saveCheckpoints(list);
  hideConfirmModal();
  openLoadCheckpointModal(); // Re-render the modal list
  showToast('Checkpoint eliminado.');
}

/**
 * Restart the active game
 */
function handleRestart(): void {
  if (!state) return;
  showConfirmModal(
    '¿Reiniciar partida?',
    'Se restablecerá el tablero al estado inicial y se perderá el historial de movimientos.',
    () => {
      hideConfirmModal();
      stopTimer();
      
      state!.board = [...state!.initialBoard];
      state!.emptyIndex = state!.initialEmptyIndex;
      state!.moveCount = 0;
      state!.solved = false;
      state!.elapsedBeforeLoad = 0;
      state!.history = [[...state!.initialBoard]];
      state!.historyIndex = 0;
      
      renderBoard();
      updateHistoryButtons();
      movesLabelEl.textContent = `Movimientos: 0`;
      timerEl.textContent = '00:00';
      startTimer();
      showToast('Partida reiniciada.');
    }
  );
}

/**
 * Return to main menu
 */
function goToMainMenu(): void {
  stopTimer();
  clearCheckpoints();
  state = null;
  winOverlayEl.classList.remove('show');
  gameAreaEl.classList.add('hidden');
  startMenuEl.classList.remove('hidden');
}

function handleExit(): void {
  if (state && !state.solved) {
    showConfirmModal(
      '¿Salir al menú?',
      'Se perderá la partida actual y todos sus checkpoints.',
      () => {
        hideConfirmModal();
        goToMainMenu();
      }
    );
  } else {
    goToMainMenu();
  }
}

/**
 * Event listeners setups
 */
function setupEventListeners(): void {
  startGameBtnEl.addEventListener('click', handleStartGame);
  
  // Game screen buttons
  undoBtnEl.addEventListener('click', undoMove);
  redoBtnEl.addEventListener('click', redoMove);
  createCheckpointBtnEl.addEventListener('click', openCreateCheckpointModal);
  gameLoadCheckpointBtnEl.addEventListener('click', openLoadCheckpointModal);
  restartGameBtnEl.addEventListener('click', handleRestart);
  exitToMenuBtnEl.addEventListener('click', handleExit);

  // Checkpoints create modal
  cancelCreateCheckpointBtnEl.addEventListener('click', () => createCheckpointOverlayEl.classList.remove('show'));
  saveCheckpointBtnEl.addEventListener('click', handleSaveCheckpoint);
  checkpointNameInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveCheckpoint();
  });

  // Checkpoints load modal
  closeLoadCheckpointBtnEl.addEventListener('click', () => loadCheckpointOverlayEl.classList.remove('show'));
  checkpointListEl.addEventListener('click', handleCheckpointAction);

  // Reusable confirm modal buttons
  confirmCancelBtnEl.addEventListener('click', hideConfirmModal);
  confirmOkBtnEl.addEventListener('click', () => {
    if (confirmCallback) {
      confirmCallback();
    }
  });

  // Win modal
  winReplayBtnEl.addEventListener('click', goToMainMenu);

  // Keyboard navigation and shortcuts
  document.addEventListener('keydown', (e) => {
    if (!state || state.solved) return;
    
    // Ignore gameplay keyboard actions if focus is in a modal input
    if (document.activeElement?.tagName === 'INPUT') return;

    // Undo / Redo shortcuts (consistent with Nonogram)
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      undoMove();
      e.preventDefault();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      redoMove();
      e.preventDefault();
      return;
    }

    let tileRow = -1;
    let tileCol = -1;
    const emptyRow = Math.floor(state.emptyIndex / state.cols);
    const emptyCol = state.emptyIndex % state.cols;

    if (e.key === 'ArrowUp') {
      // Moves the tile BELOW the empty cell UP
      tileRow = emptyRow + 1;
      tileCol = emptyCol;
    } else if (e.key === 'ArrowDown') {
      // Moves the tile ABOVE the empty cell DOWN
      tileRow = emptyRow - 1;
      tileCol = emptyCol;
    } else if (e.key === 'ArrowLeft') {
      // Moves the tile to the RIGHT of the empty cell LEFT
      tileRow = emptyRow;
      tileCol = emptyCol + 1;
    } else if (e.key === 'ArrowRight') {
      // Moves the tile to the LEFT of the empty cell RIGHT
      tileRow = emptyRow;
      tileCol = emptyCol - 1;
    } else {
      return;
    }

    if (tileRow >= 0 && tileRow < state.rows && tileCol >= 0 && tileCol < state.cols) {
      const tileIndex = tileRow * state.cols + tileCol;
      slideTile(tileIndex);
      e.preventDefault();
    }
  });
}

document.addEventListener('DOMContentLoaded', initGame);
