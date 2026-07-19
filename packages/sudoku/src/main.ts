import { createHeader } from '@sourceplay/shared';
import {
  buildPuzzle,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  boxOf,
  DifficultyKey
} from './sudoku-core';
import { randomSeed, parseSeed } from './rng';

interface HistoryState {
  values: number[];
  notes: number[];
}

interface GameState {
  seedNum: number;
  seedLabel: string;
  difficulty: DifficultyKey;
  solution: number[];
  given: boolean[];
  values: number[];
  notes: number[];
  selected: number;
  notesMode: boolean;
  solved: boolean;
  startTime: number;
  history: HistoryState[];
  historyIndex: number;
  elapsedBeforeLoad: number;
}

interface CellDOM {
  el: HTMLDivElement;
  valueSpan: HTMLSpanElement;
  notesDiv: HTMLDivElement;
  noteSpans: HTMLSpanElement[];
}

interface Checkpoint {
  id: string;
  name: string;
  dateStr: string;
  difficulty: DifficultyKey;
  seedNum: number;
  seedLabel: string;
  values: number[];
  notes: number[];
  given: boolean[];
  solution: number[];
  elapsedTime: number;
  progress: string;
}

let state: GameState | null = null;
const cells: CellDOM[] = [];
let timerId: number | null = null;
const STORAGE_KEY = 'sourceplay-sudoku-checkpoints';
let selectedMenuDifficulty: DifficultyKey = 'medio';
let conflicts = new Set<number>();

// DOM Elements
const boardEl = document.getElementById('board') as HTMLDivElement;
const keypadEl = document.getElementById('keypad') as HTMLDivElement;
const notesToggleBtn = document.getElementById('notesToggle') as HTMLButtonElement;
const eraseBtn = document.getElementById('eraseBtn') as HTMLButtonElement;
const seedLabelEl = document.getElementById('seedLabel') as HTMLElement;
const diffTagEl = document.getElementById('diffTag') as HTMLElement;
const timerEl = document.getElementById('timer') as HTMLElement;
const progressLabelEl = document.getElementById('progressLabel') as HTMLElement;
const toastEl = document.getElementById('toast') as HTMLDivElement;
const loadingVeil = document.getElementById('loadingVeil') as HTMLDivElement;
const winOverlay = document.getElementById('winOverlay') as HTMLDivElement;
const winStatsEl = document.getElementById('winStats') as HTMLElement;
const winReplayBtn = document.getElementById('winReplayBtn') as HTMLButtonElement;

// New controls elements
const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
const createCheckpointBtn = document.getElementById('createCheckpointBtn') as HTMLButtonElement;
const gameLoadCheckpointBtn = document.getElementById('gameLoadCheckpointBtn') as HTMLButtonElement;
const restartGameBtn = document.getElementById('restartGameBtn') as HTMLButtonElement;
const exitToMenuBtn = document.getElementById('exitToMenuBtn') as HTMLButtonElement;

// Start menu elements
const startMenu = document.getElementById('startMenu') as HTMLDivElement;
const gameArea = document.getElementById('gameArea') as HTMLDivElement;
const menuDiffGrid = document.getElementById('menuDiffGrid') as HTMLDivElement;
const menuSeedInput = document.getElementById('menuSeedInput') as HTMLInputElement;
const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement;

// Modal elements
const createCheckpointOverlay = document.getElementById('createCheckpointOverlay') as HTMLDivElement;
const checkpointNameInput = document.getElementById('checkpointNameInput') as HTMLInputElement;
const saveCheckpointBtn = document.getElementById('saveCheckpointBtn') as HTMLButtonElement;
const cancelCreateCheckpointBtn = document.getElementById('cancelCreateCheckpointBtn') as HTMLButtonElement;

const loadCheckpointOverlay = document.getElementById('loadCheckpointOverlay') as HTMLDivElement;
const checkpointListEl = document.getElementById('checkpointList') as HTMLDivElement;
const closeLoadCheckpointBtn = document.getElementById('closeLoadCheckpointBtn') as HTMLButtonElement;

const confirmOverlay = document.getElementById('confirmOverlay') as HTMLDivElement;
const confirmTitleEl = document.getElementById('confirmTitle') as HTMLElement;
const confirmDescEl = document.getElementById('confirmDesc') as HTMLElement;
const confirmOkBtn = document.getElementById('confirmOkBtn') as HTMLButtonElement;
const confirmCancelBtn = document.getElementById('confirmCancelBtn') as HTMLButtonElement;

let confirmCallback: (() => void) | null = null;

// ============ History Stack Lógica ============
function pushHistoryState(): void {
  if (!state) return;
  // Truncate history if we've undone moves
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push({
    values: state.values.slice(),
    notes: state.notes.slice()
  });
  state.historyIndex = state.history.length - 1;
  updateHistoryButtons();
}

function undoMove(): void {
  if (!state || state.historyIndex <= 0 || state.solved) return;
  state.historyIndex--;
  const prev = state.history[state.historyIndex];
  state.values = prev.values.slice();
  state.notes = prev.notes.slice();
  renderAll();
  updateHistoryButtons();
}

function redoMove(): void {
  if (!state || state.historyIndex >= state.history.length - 1 || state.solved) return;
  state.historyIndex++;
  const next = state.history[state.historyIndex];
  state.values = next.values.slice();
  state.notes = next.notes.slice();
  renderAll();
  updateHistoryButtons();
}

function updateHistoryButtons(): void {
  if (!state) {
    undoBtn.disabled = true;
    redoBtn.disabled = true;
    return;
  }
  undoBtn.disabled = state.historyIndex <= 0;
  redoBtn.disabled = state.historyIndex >= state.history.length - 1;
}

// ============ Confirmation Modals ============
function showConfirmModal(title: string, desc: string, onConfirm: () => void): void {
  confirmTitleEl.textContent = title;
  confirmDescEl.textContent = desc;
  confirmCallback = onConfirm;
  confirmOverlay.classList.add('show');
}

function hideConfirmModal(): void {
  confirmOverlay.classList.remove('show');
  confirmCallback = null;
}

confirmOkBtn.addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  hideConfirmModal();
});

confirmCancelBtn.addEventListener('click', hideConfirmModal);

// ============ Checkpoints System ============
function getCheckpoints(): Checkpoint[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCheckpoints(list: Checkpoint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  updateCheckpointButtons();
}

function clearCheckpoints(): void {
  localStorage.removeItem(STORAGE_KEY);
  updateCheckpointButtons();
}

function updateCheckpointButtons(): void {
  const list = getCheckpoints();
  createCheckpointBtn.disabled = list.length >= 3;
  gameLoadCheckpointBtn.disabled = list.length === 0;
}

// ============ Start Menu & Difficulty selection ============
function buildMenuDiffDOM(): void {
  menuDiffGrid.innerHTML = '';
  DIFFICULTY_ORDER.forEach((key) => {
    const b = document.createElement('button');
    b.className = 'diff-vertical-btn';
    b.textContent = DIFFICULTIES[key].label;
    b.dataset.key = key;
    b.addEventListener('click', () => {
      selectedMenuDifficulty = key;
      updateMenuDiffHighlight();
    });
    menuDiffGrid.appendChild(b);
  });
  updateMenuDiffHighlight();
}

function updateMenuDiffHighlight(): void {
  const btns = menuDiffGrid.querySelectorAll('.diff-vertical-btn');
  btns.forEach((btn) => {
    const b = btn as HTMLButtonElement;
    b.classList.toggle('active', b.dataset.key === selectedMenuDifficulty);
  });
}

function goToMainMenu(): void {
  stopTimer();
  clearCheckpoints();
  state = null;
  gameArea.classList.add('hidden');
  startMenu.classList.remove('hidden');
  winOverlay.classList.remove('show');
  updateCheckpointButtons();
}

// ============ Core Gameplay ============
function buildBoardDOM(): void {
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = String(i);
    cell.dataset.row = String(r);
    cell.dataset.col = String(c);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'value';

    const notesDiv = document.createElement('div');
    notesDiv.className = 'notes';
    const noteSpans: HTMLSpanElement[] = [];
    for (let d = 1; d <= 9; d++) {
      const s = document.createElement('span');
      s.textContent = String(d);
      notesDiv.appendChild(s);
      noteSpans.push(s);
    }

    cell.appendChild(valueSpan);
    cell.appendChild(notesDiv);
    cell.addEventListener('click', () => { selectCell(i); });
    boardEl.appendChild(cell);
    cells.push({ el: cell, valueSpan, notesDiv, noteSpans });
  }
}

function buildKeypadDOM(): void {
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement('button');
    b.className = 'key';
    b.textContent = String(d);
    b.addEventListener('click', () => { placeDigit(d); });
    keypadEl.appendChild(b);
  }
}

function newGame(difficultyKey: DifficultyKey, seedNum: number, seedLabel: string | null): void {
  loadingVeil.classList.add('show');
  stopTimer();
  setTimeout(() => {
    const built = buildPuzzle(seedNum, difficultyKey);
    state = {
      seedNum,
      seedLabel: seedLabel || String(seedNum),
      difficulty: difficultyKey,
      solution: built.solved,
      given: built.puzzle.map((v) => v !== 0),
      values: built.puzzle.slice(),
      notes: new Array(81).fill(0),
      selected: -1,
      notesMode: false,
      solved: false,
      startTime: Date.now(),
      history: [{ values: built.puzzle.slice(), notes: new Array(81).fill(0) }],
      historyIndex: 0,
      elapsedBeforeLoad: 0
    };
    renderAll();
    updateTicket();
    updateHistoryButtons();
    notesToggleBtn.classList.remove('on');
    notesToggleBtn.textContent = 'Notas: Off';
    winOverlay.classList.remove('show');
    startTimer();
    loadingVeil.classList.remove('show');
    updateCheckpointButtons();
  }, 20);
}

function updateTicket(): void {
  if (!state) return;
  seedLabelEl.textContent = '#' + state.seedLabel;
  diffTagEl.textContent = DIFFICULTIES[state.difficulty].label;
}

function getConflictIndices(): Set<number> {
  const result = new Set<number>();
  if (!state) return result;

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const v = state.values[idx];
      if (v !== 0) {
        if (!seen.has(v)) seen.set(v, []);
        seen.get(v)!.push(idx);
      }
    }
    for (const indices of seen.values()) {
      if (indices.length > 1) {
        indices.forEach(idx => result.add(idx));
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < 9; r++) {
      const idx = r * 9 + c;
      const v = state.values[idx];
      if (v !== 0) {
        if (!seen.has(v)) seen.set(v, []);
        seen.get(v)!.push(idx);
      }
    }
    for (const indices of seen.values()) {
      if (indices.length > 1) {
        indices.forEach(idx => result.add(idx));
      }
    }
  }

  // Check boxes
  for (let b = 0; b < 9; b++) {
    const seen = new Map<number, number[]>();
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const idx = (br + dr) * 9 + (bc + dc);
        const v = state.values[idx];
        if (v !== 0) {
          if (!seen.has(v)) seen.set(v, []);
          seen.get(v)!.push(idx);
        }
      }
    }
    for (const indices of seen.values()) {
      if (indices.length > 1) {
        indices.forEach(idx => result.add(idx));
      }
    }
  }

  return result;
}

function renderCell(i: number): void {
  if (!state) return;
  const st = cells[i];
  const v = state.values[i];
  st.el.classList.toggle('given', state.given[i]);
  st.el.classList.toggle('user', !state.given[i] && v !== 0);
  st.el.classList.toggle('conflict', conflicts.has(i));
  if (v !== 0) {
    st.valueSpan.textContent = String(v);
    st.valueSpan.style.display = 'block';
    st.notesDiv.style.display = 'none';
  } else {
    st.valueSpan.textContent = '';
    st.valueSpan.style.display = 'none';
    st.notesDiv.style.display = 'grid';
    const mask = state.notes[i];
    st.noteSpans.forEach((s, idx) => {
      s.classList.toggle('on', !!(mask & (1 << idx)));
    });
  }
}

function renderAll(): void {
  conflicts = getConflictIndices();
  for (let i = 0; i < 81; i++) renderCell(i);
  updateHighlights();
  updateKeypadCounts();
  updateProgress();
}

function updateHighlights(): void {
  cells.forEach((c) => { c.el.classList.remove('selected', 'peer', 'same-value'); });
  if (!state || state.selected === -1) return;
  const sel = state.selected;
  const sr = Math.floor(sel / 9);
  const sc = sel % 9;
  const sb = boxOf(sr, sc);
  const selVal = state.values[sel];
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = boxOf(r, c);
    if (i === sel) {
      cells[i].el.classList.add('selected');
      continue;
    }
    if (r === sr || c === sc || b === sb) cells[i].el.classList.add('peer');
    if (selVal !== 0 && state.values[i] === selVal) cells[i].el.classList.add('same-value');
  }
}

function updateKeypadCounts(): void {
  if (!state) return;
  const counts = new Array(10).fill(0);
  state.values.forEach((v) => { if (v) counts[v]++; });
  const keyBtns = keypadEl.querySelectorAll('.key');
  keyBtns.forEach((btn, idx) => {
    const b = btn as HTMLButtonElement;
    const d = idx + 1;
    b.classList.toggle('used', counts[d] >= 9);
  });
}

function updateProgress(): void {
  if (!state) return;
  const filled = state.values.filter((v) => v !== 0).length;
  progressLabelEl.textContent = filled + ' / 81';
}

function selectCell(i: number): void {
  if (!state) return;
  state.selected = i;
  updateHighlights();
}

function clearPeerNotes(i: number, d: number): void {
  if (!state) return;
  const r = Math.floor(i / 9);
  const c = i % 9;
  const b = boxOf(r, c);
  const bit = 1 << (d - 1);
  for (let j = 0; j < 81; j++) {
    if (j === i) continue;
    const jr = Math.floor(j / 9);
    const jc = j % 9;
    const jb = boxOf(jr, jc);
    if (jr === r || jc === c || jb === b) {
      if (state.notes[j] & bit) {
        state.notes[j] &= ~bit;
        renderCell(j);
      }
    }
  }
}

function placeDigit(d: number): void {
  if (!state || state.selected === -1 || state.solved) return;
  const i = state.selected;
  if (state.given[i]) return;
  if (state.notesMode) {
    state.notes[i] ^= (1 << (d - 1));
    renderCell(i);
    updateHighlights();
  } else {
    state.values[i] = (state.values[i] === d) ? 0 : d;
    state.notes[i] = 0;
    if (state.values[i] !== 0) clearPeerNotes(i, d);
    checkWin();
    renderAll();
  }
  pushHistoryState();
}

function eraseCell(): void {
  if (!state || state.selected === -1 || state.solved) return;
  const i = state.selected;
  if (state.given[i]) return;
  state.values[i] = 0;
  state.notes[i] = 0;
  renderAll();
  pushHistoryState();
}

function toggleNotesMode(): void {
  if (!state) return;
  state.notesMode = !state.notesMode;
  notesToggleBtn.classList.toggle('on', state.notesMode);
  notesToggleBtn.textContent = 'Notas: ' + (state.notesMode ? 'On' : 'Off');
}

function checkWin(): void {
  if (!state) return;
  if (state.values.indexOf(0) !== -1) return;
  let ok = true;
  for (let i = 0; i < 81; i++) {
    if (state.values[i] !== state.solution[i]) { ok = false; break; }
  }
  if (ok) {
    state.solved = true;
    stopTimer();
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
    winStatsEl.textContent = 'Dificultad ' + DIFFICULTIES[state.difficulty].label + ' · semilla #' + state.seedLabel + ' · tiempo ' + formatTime(elapsed);
    winOverlay.classList.add('show');
  } else {
    showToast('El tablero está completo, pero contiene errores.');
  }
}

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function startTimer(): void {
  stopTimer();
  timerId = window.setInterval(() => {
    if (!state) return;
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
    timerEl.textContent = formatTime(elapsed);
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
  toastTimeout = window.setTimeout(() => { toastEl.classList.remove('show'); }, 2600);
}

function moveSelection(key: string): void {
  if (!state) return;
  let i = state.selected;
  if (i === -1) { selectCell(0); return; }
  let r = Math.floor(i / 9);
  let c = i % 9;
  if (key === 'ArrowUp') r = (r + 8) % 9;
  else if (key === 'ArrowDown') r = (r + 1) % 9;
  else if (key === 'ArrowLeft') c = (c + 8) % 9;
  else if (key === 'ArrowRight') c = (c + 1) % 9;
  selectCell(r * 9 + c);
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!state) return;
  if (e.key >= '1' && e.key <= '9') {
    placeDigit(parseInt(e.key, 10));
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    eraseCell();
  } else if (e.key === 'n' || e.key === 'N') {
    toggleNotesMode();
  } else if (e.key.indexOf('Arrow') === 0) {
    moveSelection(e.key);
    e.preventDefault();
  }
}

// ============ Checkpoints DOM Rendering ============
function renderCheckpointList(): void {
  const list = getCheckpoints();
  checkpointListEl.innerHTML = '';
  if (list.length === 0) {
    checkpointListEl.innerHTML = '<p style="text-align: center; color: var(--ink-soft); font-size: 12px; width: 100%;">No hay checkpoints guardados.</p>';
    return;
  }
  list.forEach((cp) => {
    const card = document.createElement('div');
    card.className = 'checkpoint-card';
    card.innerHTML = `
      <div class="checkpoint-card-header">
        <span class="checkpoint-card-name">${cp.name}</span>
        <span class="checkpoint-card-date">${cp.dateStr}</span>
      </div>
      <div class="checkpoint-card-details">
        Dificultad: ${DIFFICULTIES[cp.difficulty].label} · Progreso: ${cp.progress}
      </div>
      <div class="checkpoint-card-actions">
        <button class="checkpoint-btn primary" data-action="load" data-id="${cp.id}">Cargar</button>
        <button class="checkpoint-btn" data-action="delete" data-id="${cp.id}" style="border-color: var(--danger); color: var(--danger);">Borrar</button>
      </div>
    `;
    checkpointListEl.appendChild(card);
  });

  checkpointListEl.querySelectorAll('.checkpoint-btn').forEach((btn) => {
    const b = btn as HTMLButtonElement;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = b.dataset.action;
      const id = b.dataset.id;
      if (!id) return;
      if (action === 'load') {
        confirmLoadCheckpoint(id);
      } else if (action === 'delete') {
        confirmDeleteCheckpoint(id);
      }
    });
  });
}

function confirmLoadCheckpoint(id: string): void {
  const list = getCheckpoints();
  const cp = list.find((item) => item.id === id);
  if (!cp) return;

  const executeLoad = (): void => {
    state = {
      seedNum: cp.seedNum,
      seedLabel: cp.seedLabel,
      difficulty: cp.difficulty,
      solution: cp.solution.slice(),
      given: cp.given.slice(),
      values: cp.values.slice(),
      notes: cp.notes.slice(),
      selected: -1,
      notesMode: false,
      solved: false,
      startTime: Date.now(),
      elapsedBeforeLoad: cp.elapsedTime,
      history: [{ values: cp.values.slice(), notes: cp.notes.slice() }],
      historyIndex: 0
    };

    loadCheckpointOverlay.classList.remove('show');
    startMenu.classList.add('hidden');
    gameArea.classList.remove('hidden');

    renderAll();
    updateTicket();
    updateHistoryButtons();
    notesToggleBtn.classList.remove('on');
    notesToggleBtn.textContent = 'Notas: Off';
    winOverlay.classList.remove('show');
    startTimer();
    showToast('Partida cargada.');
  };

  if (state && !state.solved) {
    showConfirmModal(
      'Cargar Checkpoint',
      '¿Estás seguro de que deseas cargar este checkpoint? Se perderá todo el progreso de la partida actual.',
      executeLoad
    );
  } else {
    executeLoad();
  }
}

function confirmDeleteCheckpoint(id: string): void {
  showConfirmModal(
    'Borrar Checkpoint',
    '¿Estás seguro de que deseas eliminar este checkpoint de forma permanente? Esta acción no se puede deshacer.',
    () => {
      let list = getCheckpoints();
      list = list.filter((item) => item.id !== id);
      saveCheckpoints(list);
      renderCheckpointList();
      showToast('Checkpoint eliminado.');
    }
  );
}

// ============ Initialization ============
function initSudoku(): void {
  // Inyectar cabecera global compartida con botón de retroceso activo
  createHeader({ showBackButton: true, title: 'Sudoku' });

  buildBoardDOM();
  buildKeypadDOM();
  buildMenuDiffDOM();

  document.addEventListener('keydown', handleKeyDown);

  // Gameplay Events
  notesToggleBtn.addEventListener('click', toggleNotesMode);
  eraseBtn.addEventListener('click', eraseCell);

  // Undo / Redo Events
  undoBtn.addEventListener('click', undoMove);
  redoBtn.addEventListener('click', redoMove);

  // Restart / Exit Events
  restartGameBtn.addEventListener('click', () => {
    if (!state || state.solved) return;
    showConfirmModal(
      'Reiniciar sudoku',
      '¿Estás seguro de que deseas restablecer el tablero a su estado inicial? Se perderá tu progreso actual.',
      () => {
        const initialPuzzle = state!.history[0].values.slice();
        state!.values = initialPuzzle;
        state!.notes = new Array(81).fill(0);
        state!.startTime = Date.now();
        state!.elapsedBeforeLoad = 0;
        state!.history = [{ values: initialPuzzle, notes: new Array(81).fill(0) }];
        state!.historyIndex = 0;
        renderAll();
        updateHistoryButtons();
        showToast('Sudoku restablecido.');
      }
    );
  });

  exitToMenuBtn.addEventListener('click', () => {
    if (!state) return;
    if (state.solved) {
      goToMainMenu();
      return;
    }
    showConfirmModal(
      'Salir al menú',
      '¿Estás seguro de que deseas abandonar la partida actual? Se perderá todo el progreso de la partida actual.',
      () => {
        goToMainMenu();
      }
    );
  });

  // Start Game Button
  startGameBtn.addEventListener('click', () => {
    const raw = menuSeedInput.value.trim();
    const seedNum = raw ? parseSeed(raw) : randomSeed();
    
    // Clear checkpoints from the previous game session (Requirement: do not persist checkpoints between games)
    clearCheckpoints();

    startMenu.classList.add('hidden');
    gameArea.classList.remove('hidden');

    newGame(selectedMenuDifficulty, seedNum, raw || null);
    menuSeedInput.value = '';
  });

  // Checkpoint UI Actions
  createCheckpointBtn.addEventListener('click', () => {
    if (!state || state.solved) return;
    const list = getCheckpoints();
    if (list.length >= 3) {
      showToast('Límite de 3 checkpoints alcanzado.');
      return;
    }
    checkpointNameInput.value = `Checkpoint ${list.length + 1}`;
    createCheckpointOverlay.classList.add('show');
  });

  cancelCreateCheckpointBtn.addEventListener('click', () => {
    createCheckpointOverlay.classList.remove('show');
  });

  saveCheckpointBtn.addEventListener('click', () => {
    if (!state) return;
    const name = checkpointNameInput.value.trim();
    if (!name) {
      showToast('Escribe un nombre para el checkpoint.');
      return;
    }
    const list = getCheckpoints();
    if (list.length >= 3) return;

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
    const filled = state.values.filter((v) => v !== 0).length;

    const newCp: Checkpoint = {
      id: String(Date.now()),
      name: name,
      dateStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      difficulty: state.difficulty,
      seedNum: state.seedNum,
      seedLabel: state.seedLabel,
      values: state.values.slice(),
      notes: state.notes.slice(),
      given: state.given.slice(),
      solution: state.solution.slice(),
      elapsedTime: elapsed,
      progress: `${filled} / 81`
    };

    list.push(newCp);
    saveCheckpoints(list);
    createCheckpointOverlay.classList.remove('show');
    showToast('Checkpoint creado.');
  });

  const openLoadModal = (): void => {
    renderCheckpointList();
    loadCheckpointOverlay.classList.add('show');
  };

  gameLoadCheckpointBtn.addEventListener('click', openLoadModal);

  closeLoadCheckpointBtn.addEventListener('click', () => {
    loadCheckpointOverlay.classList.remove('show');
  });

  winReplayBtn.addEventListener('click', () => {
    goToMainMenu();
  });

  // Initial update
  updateCheckpointButtons();

  // Click outside to deselect cell
  document.addEventListener('click', (e) => {
    if (!state) return;
    const target = e.target as HTMLElement;
    const isInsideBoard = boardEl.contains(target);
    const isInsideControls = (
      keypadEl.contains(target) || 
      document.querySelector('.controls')?.contains(target) ||
      target.closest('.modal') ||
      target.closest('.sp-theme-toggle') ||
      target.closest('.sp-back-btn')
    );
    if (!isInsideBoard && !isInsideControls) {
      state.selected = -1;
      updateHighlights();
    }
  });
}

document.addEventListener('DOMContentLoaded', initSudoku);
