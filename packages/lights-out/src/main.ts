import { createHeader } from '@sourceplay/shared';
import { parseSeed, randomSeed } from './rng';
import { DifficultyKey, SIZES_LABELS, buildPuzzle, solveLightsOut } from './lights-out-core';

interface GameState {
  seedNum: number;
  seedLabel: string;
  difficulty: DifficultyKey;
  N: number;
  board: number[];             // Flat binary array representing active status (1 = on, 0 = off)
  initialBoard: number[];      // Saved snapshot for restarting
  solved: boolean;
  moveCount: number;
  optimalMoves: number;
  startTime: number;
  elapsedBeforeLoad: number;
  history: number[][];         // Deep copy states stack
  historyIndex: number;
}

interface Checkpoint {
  id: number;
  name: string;
  dateStr: string;
  board: number[];
  initialBoard: number[];
  difficulty: DifficultyKey;
  seedNum: number;
  seedLabel: string;
  moveCount: number;
  optimalMoves: number;
  elapsedTime: number;
  N: number;
}

const STORAGE_KEY = 'sourceplay-lights-out-checkpoints';

let state: GameState | null = null;
let timerInterval: number | null = null;
let selectedDifficulty: DifficultyKey = 'medio';

// DOM references
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

let undoBtnEl: HTMLButtonElement;
let redoBtnEl: HTMLButtonElement;
let createCheckpointBtnEl: HTMLButtonElement;
let gameLoadCheckpointBtnEl: HTMLButtonElement;
let hintBtnEl: HTMLButtonElement;
let restartGameBtnEl: HTMLButtonElement;
let exitToMenuBtnEl: HTMLButtonElement;

let toastEl: HTMLElement;

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
let winOptimalStatsEl: HTMLElement;
let winRestartBtnEl: HTMLButtonElement;
let winReplayBtnEl: HTMLButtonElement;
let winHomeBtnEl: HTMLButtonElement;

function initGame(): void {
  createHeader({ showBackButton: true });

  startMenuEl = document.getElementById('startMenu')!;
  gameAreaEl = document.getElementById('gameArea')!;
  menuDiffGridEl = document.getElementById('menuDiffGrid')!;
  menuSeedInputEl = document.getElementById('menuSeedInput') as HTMLInputElement;
  startGameBtnEl = document.getElementById('startGameBtn') as HTMLButtonElement;

  seedLabelEl = document.getElementById('seedLabel')!;
  diffTagEl = document.getElementById('diffTag')!;
  boardEl = document.getElementById('board')!;
  loadingVeilEl = document.getElementById('loadingVeil')!;
  timerEl = document.getElementById('timer')!;
  movesLabelEl = document.getElementById('movesLabel')!;

  undoBtnEl = document.getElementById('undoBtn') as HTMLButtonElement;
  redoBtnEl = document.getElementById('redoBtn') as HTMLButtonElement;
  createCheckpointBtnEl = document.getElementById('createCheckpointBtn') as HTMLButtonElement;
  gameLoadCheckpointBtnEl = document.getElementById('gameLoadCheckpointBtn') as HTMLButtonElement;
  hintBtnEl = document.getElementById('hintBtn') as HTMLButtonElement;
  restartGameBtnEl = document.getElementById('restartGameBtn') as HTMLButtonElement;
  exitToMenuBtnEl = document.getElementById('exitToMenuBtn') as HTMLButtonElement;

  toastEl = document.getElementById('toast')!;

  createCheckpointOverlayEl = document.getElementById('createCheckpointOverlay')!;
  checkpointNameInputEl = document.getElementById('checkpointNameInput') as HTMLInputElement;
  cancelCreateCheckpointBtnEl = document.getElementById('cancelCreateCheckpointBtn') as HTMLButtonElement;
  saveCheckpointBtnEl = document.getElementById('saveCheckpointBtn') as HTMLButtonElement;

  loadCheckpointOverlayEl = document.getElementById('loadCheckpointOverlay')!;
  checkpointListEl = document.getElementById('checkpointList')!;
  closeLoadCheckpointBtnEl = document.getElementById('closeLoadCheckpointBtn') as HTMLButtonElement;

  confirmOverlayEl = document.getElementById('confirmOverlay')!;
  confirmTitleEl = document.getElementById('confirmTitle')!;
  confirmDescEl = document.getElementById('confirmDesc')!;
  confirmCancelBtnEl = document.getElementById('confirmCancelBtn') as HTMLButtonElement;
  confirmOkBtnEl = document.getElementById('confirmOkBtn') as HTMLButtonElement;

  winOverlayEl = document.getElementById('winOverlay')!;
  winStatsEl = document.getElementById('winStats')!;
  winOptimalStatsEl = document.getElementById('winOptimalStats')!;
  winRestartBtnEl = document.getElementById('winRestartBtn') as HTMLButtonElement;
  winReplayBtnEl = document.getElementById('winReplayBtn') as HTMLButtonElement;
  winHomeBtnEl = document.getElementById('winHomeBtn') as HTMLButtonElement;

  buildDifficultySelector();
  setupEventListeners();
  updateLoadCheckpointButtonState();
}

function buildDifficultySelector(): void {
  menuDiffGridEl.innerHTML = '';
  (Object.keys(SIZES_LABELS) as DifficultyKey[]).forEach((key) => {
    const btn = document.createElement('button');
    btn.className = `diff-vertical-btn ${key === selectedDifficulty ? 'active' : ''}`;
    btn.textContent = SIZES_LABELS[key];
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-vertical-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = key;
    });
    menuDiffGridEl.appendChild(btn);
  });
}

function showToast(message: string): void {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

function showConfirmModal(title: string, desc: string, onConfirm: () => void): void {
  confirmTitleEl.textContent = title;
  confirmDescEl.textContent = desc;
  confirmCallback = onConfirm;
  confirmOverlayEl.classList.add('show');
}

function hideConfirmModal(): void {
  confirmOverlayEl.classList.remove('show');
  confirmCallback = null;
}

function startTimer(): void {
  if (timerInterval) clearInterval(timerInterval);
  state!.startTime = Date.now();
  timerInterval = window.setInterval(updateTimerDisplay, 1000);
}

function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay(): void {
  if (!state) return;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
  timerEl.textContent = formatTime(elapsed);
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function handleStartGame(): void {
  const seedInput = menuSeedInputEl.value.trim();
  const seedNum = seedInput ? parseSeed(seedInput) : randomSeed();
  const seedLabel = seedInput ? seedInput : seedNum.toString();

  clearCheckpoints();
  newGame(selectedDifficulty, seedNum, seedLabel);
}

function newGame(diffKey: DifficultyKey, seedNum: number, seedLabel: string): void {
  startMenuEl.classList.add('hidden');
  gameAreaEl.classList.remove('hidden');
  loadingVeilEl.classList.add('show');

  setTimeout(() => {
    const puzzle = buildPuzzle(seedNum, diffKey);

    state = {
      seedNum,
      seedLabel,
      difficulty: diffKey,
      N: puzzle.N,
      board: [...puzzle.initialState],
      initialBoard: [...puzzle.initialState],
      solved: false,
      moveCount: 0,
      optimalMoves: puzzle.optimalMoves,
      startTime: 0,
      elapsedBeforeLoad: 0,
      history: [[...puzzle.initialState]],
      historyIndex: 0
    };

    loadingVeilEl.classList.remove('show');

    boardEl.style.setProperty('--cols', state.N.toString());
    boardEl.style.setProperty('--rows', state.N.toString());

    seedLabelEl.textContent = seedLabel;
    diffTagEl.textContent = SIZES_LABELS[diffKey].split(' ')[0];

    renderBoard();
    updateHistoryButtons();
    movesLabelEl.textContent = `Movimientos: 0`;
    timerEl.textContent = '00:00';
    startTimer();
  }, 50);
}

function renderBoard(): void {
  if (!state) return;
  boardEl.innerHTML = '';

  state.board.forEach((val, idx) => {
    const tile = document.createElement('div');
    tile.className = `tile ${val === 1 ? 'light-on' : 'light-off'}`;
    tile.setAttribute('data-index', idx.toString());

    tile.addEventListener('click', () => {
      toggleCell(idx);
    });

    boardEl.appendChild(tile);
  });
}

function toggleCell(index: number): void {
  if (!state || state.solved) return;

  const N = state.N;
  const r = Math.floor(index / N);
  const c = index % N;

  // Toggle cell + orth neighbors
  state.board[index] ^= 1;
  if (r > 0) state.board[(r - 1) * N + c] ^= 1;
  if (r < N - 1) state.board[(r + 1) * N + c] ^= 1;
  if (c > 0) state.board[r * N + (c - 1)] ^= 1;
  if (c < N - 1) state.board[r * N + (c + 1)] ^= 1;

  state.moveCount++;
  movesLabelEl.textContent = `Movimientos: ${state.moveCount}`;

  pushHistoryState();
  renderBoard();
  checkWin();
}

function checkWin(): void {
  if (!state) return;
  const activeCount = state.board.reduce((sum, val) => sum + val, 0);
  if (activeCount === 0) {
    state.solved = true;
    stopTimer();

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
    winStatsEl.innerHTML = `Completado en <b>${formatTime(elapsed)}</b> con <b>${state.moveCount} movimientos</b>.`;
    winOptimalStatsEl.innerHTML = `La mejor solución inicial requería <b>${state.optimalMoves} movimientos</b>.`;
    winOverlayEl.classList.add('show');
  }
}

function pushHistoryState(): void {
  if (!state) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push([...state.board]);

  if (state.history.length > 100) {
    state.history.shift();
  } else {
    state.historyIndex++;
  }
  updateHistoryButtons();
}

function undoMove(): void {
  if (!state || state.historyIndex <= 0 || state.solved) return;
  state.historyIndex--;
  state.board = [...state.history[state.historyIndex]];
  renderBoard();
  updateHistoryButtons();
}

function redoMove(): void {
  if (!state || state.historyIndex >= state.history.length - 1 || state.solved) return;
  state.historyIndex++;
  state.board = [...state.history[state.historyIndex]];
  renderBoard();
  updateHistoryButtons();
}

function updateHistoryButtons(): void {
  if (!state) return;
  undoBtnEl.disabled = state.historyIndex <= 0 || state.solved;
  redoBtnEl.disabled = state.historyIndex >= state.history.length - 1 || state.solved;
}

function triggerHint(): void {
  if (!state || state.solved) return;

  // Compute optimal solution from current board layout
  const optClicks = solveLightsOut(state.N, state.board);
  if (!optClicks) {
    showToast("¡Este tablero no es resoluble!");
    return;
  }

  const clickIndex = optClicks.indexOf(1);
  if (clickIndex === -1) {
    showToast("¡El tablero ya está resuelto!");
    return;
  }

  // Flash recommended element
  const cellEl = boardEl.querySelector(`[data-index="${clickIndex}"]`);
  if (cellEl) {
    cellEl.classList.remove('hint-flash');
    // Force reflow
    void (cellEl as HTMLElement).offsetWidth;
    cellEl.classList.add('hint-flash');
    setTimeout(() => {
      cellEl.classList.remove('hint-flash');
    }, 1500);
  }
}

// Checkpoints Storage
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
    initialBoard: [...state.initialBoard],
    difficulty: state.difficulty,
    seedNum: state.seedNum,
    seedLabel: state.seedLabel,
    moveCount: state.moveCount,
    optimalMoves: state.optimalMoves,
    elapsedTime: elapsed,
    N: state.N
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
        Dificultad: ${SIZES_LABELS[cp.difficulty].split(' ')[0]} | Movimientos: ${cp.moveCount} | Tiempo: ${formatTime(cp.elapsedTime)}
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

  state = {
    seedNum: cp.seedNum,
    seedLabel: cp.seedLabel,
    difficulty: cp.difficulty,
    N: cp.N,
    board: [...cp.board],
    initialBoard: [...cp.initialBoard],
    solved: false,
    moveCount: cp.moveCount,
    optimalMoves: cp.optimalMoves || 0,
    startTime: Date.now(),
    elapsedBeforeLoad: cp.elapsedTime,
    history: [[...cp.board]],
    historyIndex: 0
  };

  startMenuEl.classList.add('hidden');
  gameAreaEl.classList.remove('hidden');

  boardEl.style.setProperty('--cols', state.N.toString());
  boardEl.style.setProperty('--rows', state.N.toString());

  seedLabelEl.textContent = cp.seedLabel;
  diffTagEl.textContent = SIZES_LABELS[cp.difficulty].split(' ')[0];

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
  openLoadCheckpointModal();
  showToast('Checkpoint eliminado.');
}

function handleRestart(): void {
  if (!state) return;
  showConfirmModal(
    '¿Reiniciar partida?',
    'Se restablecerá el tablero al estado inicial y se perderá el historial de movimientos.',
    () => {
      hideConfirmModal();
      stopTimer();

      state!.board = [...state!.initialBoard];
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

function setupEventListeners(): void {
  startGameBtnEl.addEventListener('click', handleStartGame);

  undoBtnEl.addEventListener('click', undoMove);
  redoBtnEl.addEventListener('click', redoMove);
  createCheckpointBtnEl.addEventListener('click', openCreateCheckpointModal);
  gameLoadCheckpointBtnEl.addEventListener('click', openLoadCheckpointModal);
  hintBtnEl.addEventListener('click', triggerHint);
  restartGameBtnEl.addEventListener('click', handleRestart);
  exitToMenuBtnEl.addEventListener('click', handleExit);

  cancelCreateCheckpointBtnEl.addEventListener('click', () => createCheckpointOverlayEl.classList.remove('show'));
  saveCheckpointBtnEl.addEventListener('click', handleSaveCheckpoint);
  checkpointNameInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSaveCheckpoint();
  });

  closeLoadCheckpointBtnEl.addEventListener('click', () => loadCheckpointOverlayEl.classList.remove('show'));
  checkpointListEl.addEventListener('click', handleCheckpointAction);

  confirmCancelBtnEl.addEventListener('click', hideConfirmModal);
  confirmOkBtnEl.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
  });

  // Win screen binds
  winRestartBtnEl.addEventListener('click', () => {
    winOverlayEl.classList.remove('show');
    if (state) {
      stopTimer();
      state.board = [...state.initialBoard];
      state.moveCount = 0;
      state.solved = false;
      state.elapsedBeforeLoad = 0;
      state.history = [[...state.initialBoard]];
      state.historyIndex = 0;
      renderBoard();
      updateHistoryButtons();
      movesLabelEl.textContent = `Movimientos: 0`;
      timerEl.textContent = '00:00';
      startTimer();
    }
  });

  winReplayBtnEl.addEventListener('click', () => {
    winOverlayEl.classList.remove('show');
    if (state) {
      newGame(state.difficulty, randomSeed(), randomSeed().toString());
    }
  });

  winHomeBtnEl.addEventListener('click', () => {
    winOverlayEl.classList.remove('show');
    goToMainMenu();
  });

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  document.addEventListener('keydown', (e) => {
    if (!state || state.solved) return;
    if (document.activeElement?.tagName === 'INPUT') return;

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
  });
}

document.addEventListener('DOMContentLoaded', initGame);
