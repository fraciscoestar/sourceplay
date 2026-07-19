import { createHeader } from '@sourceplay/shared';
import { buildPuzzle, checkVictory, SIZES, SIZE_ORDER, SizeKey } from './nonogram-core';
import { randomSeed, parseSeed } from './rng';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GameState {
  seedNum: number;
  seedLabel: string;
  sizeKey: SizeKey;
  rows: number;
  cols: number;
  solution: number[];       // 1=filled, 0=empty
  grid: number[];           // 0=empty, 1=filled, 2=cross
  rowClues: number[][];
  colClues: number[][];
  tool: 'fill' | 'cross';
  solved: boolean;
  startTime: number;
  history: number[][];      // each entry is a full grid snapshot
  historyIndex: number;
  elapsedBeforeLoad: number;
}

interface Checkpoint {
  id: string;
  name: string;
  dateStr: string;
  sizeKey: SizeKey;
  seedNum: number;
  seedLabel: string;
  grid: number[];
  solution: number[];
  rowClues: number[][];
  colClues: number[][];
  rows: number;
  cols: number;
  elapsedTime: number;
  progress: string;
}

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

let state: GameState | null = null;
let timerId: number | null = null;
let toastTimeout: number | null = null;
let confirmCallback: (() => void) | null = null;
let selectedMenuSize: SizeKey = 'medio';
// Drag state
let isDragging = false;
let dragAction: 'fill' | 'cross' | 'clear' | null = null;
let dragStartCellState: number | null = null;
let dragStartRow: number | null = null;
let dragStartCol: number | null = null;

const STORAGE_KEY = 'sourceplay-nonogram-checkpoints';

// ─────────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────────

const startMenu       = document.getElementById('startMenu')             as HTMLDivElement;
const gameArea        = document.getElementById('gameArea')              as HTMLDivElement;
const menuSizeGrid    = document.getElementById('menuSizeGrid')          as HTMLDivElement;
const menuSeedInput   = document.getElementById('menuSeedInput')         as HTMLInputElement;
const startGameBtn    = document.getElementById('startGameBtn')          as HTMLButtonElement;

const nonogramWrap    = document.getElementById('nonogramWrap')          as HTMLDivElement;
const boardEl         = document.getElementById('board')                 as HTMLDivElement;
const colCluesEl      = document.getElementById('colClues')              as HTMLDivElement;
const rowCluesEl      = document.getElementById('rowClues')              as HTMLDivElement;

const seedLabelEl     = document.getElementById('seedLabel')             as HTMLElement;
const sizeTagEl       = document.getElementById('sizeTag')               as HTMLElement;
const timerEl         = document.getElementById('timer')                 as HTMLElement;
const progressLabelEl = document.getElementById('progressLabel')         as HTMLElement;
const toastEl         = document.getElementById('toast')                 as HTMLDivElement;

const toolFillBtn     = document.getElementById('toolFill')              as HTMLButtonElement;
const toolCrossBtn    = document.getElementById('toolCross')             as HTMLButtonElement;

const undoBtn         = document.getElementById('undoBtn')               as HTMLButtonElement;
const redoBtn         = document.getElementById('redoBtn')               as HTMLButtonElement;
const createCpBtn     = document.getElementById('createCheckpointBtn')   as HTMLButtonElement;
const loadCpBtn       = document.getElementById('gameLoadCheckpointBtn') as HTMLButtonElement;
const restartBtn      = document.getElementById('restartGameBtn')        as HTMLButtonElement;
const exitBtn         = document.getElementById('exitToMenuBtn')         as HTMLButtonElement;

const createCpOverlay = document.getElementById('createCheckpointOverlay') as HTMLDivElement;
const cpNameInput     = document.getElementById('checkpointNameInput')   as HTMLInputElement;
const saveCpBtn       = document.getElementById('saveCheckpointBtn')     as HTMLButtonElement;
const cancelCpBtn     = document.getElementById('cancelCreateCheckpointBtn') as HTMLButtonElement;

const loadCpOverlay   = document.getElementById('loadCheckpointOverlay') as HTMLDivElement;
const cpListEl        = document.getElementById('checkpointList')        as HTMLDivElement;
const closeCpBtn      = document.getElementById('closeLoadCheckpointBtn') as HTMLButtonElement;

const confirmOverlay  = document.getElementById('confirmOverlay')        as HTMLDivElement;
const confirmTitleEl  = document.getElementById('confirmTitle')          as HTMLElement;
const confirmDescEl   = document.getElementById('confirmDesc')           as HTMLElement;
const confirmOkBtn    = document.getElementById('confirmOkBtn')          as HTMLButtonElement;
const confirmCancelBtn = document.getElementById('confirmCancelBtn')     as HTMLButtonElement;

const winOverlay      = document.getElementById('winOverlay')            as HTMLDivElement;
const winStatsEl      = document.getElementById('winStats')              as HTMLElement;
const winReplayBtn    = document.getElementById('winReplayBtn')          as HTMLButtonElement;

const errorModalOverlay  = document.getElementById('errorModalOverlay')  as HTMLDivElement;
const errorModalDescEl   = document.getElementById('errorModalDesc')     as HTMLElement;
const errorModalCloseBtn = document.getElementById('errorModalCloseBtn') as HTMLButtonElement;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function showToast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  if (toastTimeout !== null) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => { toastEl.classList.remove('show'); }, 2600);
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
  if (timerId !== null) { clearInterval(timerId); timerId = null; }
}

// ─────────────────────────────────────────────
// History (Undo / Redo)
// ─────────────────────────────────────────────

function pushHistoryState(): void {
  if (!state) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(state.grid.slice());
  state.historyIndex = state.history.length - 1;
  updateHistoryButtons();
}

function undoMove(): void {
  if (!state || state.historyIndex <= 0 || state.solved) return;
  state.historyIndex--;
  state.grid = state.history[state.historyIndex].slice();
  renderAll();
  updateHistoryButtons();
}

function redoMove(): void {
  if (!state || state.historyIndex >= state.history.length - 1 || state.solved) return;
  state.historyIndex++;
  state.grid = state.history[state.historyIndex].slice();
  renderAll();
  updateHistoryButtons();
}

function updateHistoryButtons(): void {
  undoBtn.disabled = !state || state.historyIndex <= 0;
  redoBtn.disabled = !state || state.historyIndex >= state.history.length - 1;
}

// ─────────────────────────────────────────────
// Confirm Modal
// ─────────────────────────────────────────────

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

confirmOkBtn.addEventListener('click', () => { if (confirmCallback) confirmCallback(); hideConfirmModal(); });
confirmCancelBtn.addEventListener('click', hideConfirmModal);

// ─────────────────────────────────────────────
// Checkpoints
// ─────────────────────────────────────────────

function getCheckpoints(): Checkpoint[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) as Checkpoint[] : [];
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
  createCpBtn.disabled = !state || state.solved || list.length >= 3;
  loadCpBtn.disabled = list.length === 0;
}

function renderCheckpointList(): void {
  const list = getCheckpoints();
  cpListEl.innerHTML = '';
  if (list.length === 0) {
    cpListEl.innerHTML = '<p style="text-align:center;color:var(--ink-soft);font-size:12px;">No hay checkpoints guardados.</p>';
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
        Tamaño: ${SIZES[cp.sizeKey].label} &nbsp;·&nbsp; Progreso: ${cp.progress}
      </div>
      <div class="checkpoint-card-actions">
        <button class="checkpoint-btn primary" data-action="load" data-id="${cp.id}">Cargar</button>
        <button class="checkpoint-btn" data-action="delete" data-id="${cp.id}" style="border-color:var(--danger);color:var(--danger);">Borrar</button>
      </div>
    `;
    cpListEl.appendChild(card);
  });

  cpListEl.querySelectorAll<HTMLButtonElement>('.checkpoint-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const { action, id } = btn.dataset;
      if (!id) return;
      if (action === 'load') confirmLoadCheckpoint(id);
      else if (action === 'delete') confirmDeleteCheckpoint(id);
    });
  });
}

function confirmLoadCheckpoint(id: string): void {
  const cp = getCheckpoints().find((c) => c.id === id);
  if (!cp) return;
  const executeLoad = () => {
    state = {
      seedNum: cp.seedNum,
      seedLabel: cp.seedLabel,
      sizeKey: cp.sizeKey,
      rows: cp.rows,
      cols: cp.cols,
      solution: cp.solution.slice(),
      grid: cp.grid.slice(),
      rowClues: cp.rowClues,
      colClues: cp.colClues,
      tool: 'fill',
      solved: false,
      startTime: Date.now(),
      elapsedBeforeLoad: cp.elapsedTime,
      history: [cp.grid.slice()],
      historyIndex: 0
    };
    loadCpOverlay.classList.remove('show');
    startMenu.classList.add('hidden');
    gameArea.classList.remove('hidden');
    buildBoard();
    renderAll();
    updateTicket();
    updateHistoryButtons();
    winOverlay.classList.remove('show');
    startTimer();
    showToast('Partida cargada.');
  };

  if (state && !state.solved) {
    showConfirmModal('Cargar Checkpoint',
      '¿Estás seguro? Se perderá el progreso de la partida actual.',
      executeLoad);
  } else {
    executeLoad();
  }
}

function confirmDeleteCheckpoint(id: string): void {
  showConfirmModal('Borrar Checkpoint',
    '¿Estás seguro de que deseas eliminar este checkpoint? Esta acción no se puede deshacer.',
    () => {
      const list = getCheckpoints().filter((c) => c.id !== id);
      saveCheckpoints(list);
      renderCheckpointList();
      showToast('Checkpoint eliminado.');
    });
}

// ─────────────────────────────────────────────
// Board DOM
// ─────────────────────────────────────────────

function buildBoard(): void {
  if (!state) return;
  const { rows, cols, rowClues, colClues } = state;

  boardEl.innerHTML = '';
  colCluesEl.innerHTML = '';
  rowCluesEl.innerHTML = '';

  // Size the CSS grid variables
  nonogramWrap.style.setProperty('--ng-rows', String(rows));
  nonogramWrap.style.setProperty('--ng-cols', String(cols));
  nonogramWrap.className = 'nonogram-wrap size-' + state.sizeKey;

  // Column clues
  colCluesEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
  colClues.forEach((clue) => {
    const cell = document.createElement('div');
    cell.className = 'clue-cell col-clue-cell';
    clue.forEach((n) => {
      const s = document.createElement('span');
      s.textContent = String(n);
      cell.appendChild(s);
    });
    colCluesEl.appendChild(cell);
  });

  // Row clues
  rowCluesEl.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;
  rowClues.forEach((clue) => {
    const cell = document.createElement('div');
    cell.className = 'clue-cell row-clue-cell';
    clue.forEach((n) => {
      const s = document.createElement('span');
      s.textContent = String(n);
      cell.appendChild(s);
    });
    rowCluesEl.appendChild(cell);
  });

  // Main board grid
  boardEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
  boardEl.style.gridTemplateRows    = `repeat(${rows}, var(--cell-size))`;

  for (let i = 0; i < rows * cols; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cell = document.createElement('div');
    cell.className = 'ng-cell';
    cell.dataset.index = String(i);
    cell.dataset.row = String(r);
    cell.dataset.col = String(c);

    // Bold border after every 5th line (group separator)
    if (cols > 5 && c % 5 === 0 && c !== 0)           cell.classList.add('border-left-bold');
    if (rows > 5 && r % 5 === 0 && r !== 0)           cell.classList.add('border-top-bold');

    cell.addEventListener('mousedown',  (e) => { e.preventDefault(); startDrag(i); });
    cell.addEventListener('mouseenter', () => { if (isDragging) continueDrag(i); });
    cell.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(i); }, { passive: false });
    cell.addEventListener('touchmove',  (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      const idx = target?.dataset?.index;
      if (idx !== undefined) continueDrag(parseInt(idx, 10));
    }, { passive: false });

    boardEl.appendChild(cell);
  }
}

// ─────────────────────────────────────────────
// Drag Interaction
// ─────────────────────────────────────────────

function startDrag(i: number): void {
  if (!state || state.solved) return;
  isDragging = true;
  dragStartRow = Math.floor(i / state.cols);
  dragStartCol = i % state.cols;
  dragStartCellState = state.grid[i];

  const toolVal = state.tool === 'fill' ? 1 : 2;
  dragAction = dragStartCellState === toolVal ? 'clear' : state.tool;
  applyToCell(i);
}

function continueDrag(i: number): void {
  if (!isDragging || !state || state.solved) return;
  applyToCell(i);
}

function applyAutofillCrosses(): void {
  if (!state) return;
  const { rows, cols, rowClues, colClues } = state;
  let changed = false;

  // Check rows
  for (let r = 0; r < rows; r++) {
    const target = rowClues[r].reduce((a, b) => a + b, 0);
    let current = 0;
    for (let c = 0; c < cols; c++) {
      if (state.grid[r * cols + c] === 1) current++;
    }
    if (current === target) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (state.grid[idx] === 0) {
          state.grid[idx] = 2;
          renderCell(idx);
          changed = true;
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < cols; c++) {
    const target = colClues[c].reduce((a, b) => a + b, 0);
    let current = 0;
    for (let r = 0; r < rows; r++) {
      if (state.grid[r * cols + c] === 1) current++;
    }
    if (current === target) {
      for (let r = 0; r < rows; r++) {
        const idx = r * cols + c;
        if (state.grid[idx] === 0) {
          state.grid[idx] = 2;
          renderCell(idx);
          changed = true;
        }
      }
    }
  }

  if (changed) {
    updateProgress();
  }
}

function endDrag(): void {
  if (!isDragging) return;
  isDragging = false;
  if (dragAction !== null) {
    applyAutofillCrosses();
    pushHistoryState();
    dragAction = null;
    dragStartCellState = null;
    dragStartRow = null;
    dragStartCol = null;
    checkGameStatus();
  }
}

function applyToCell(i: number): void {
  if (!state || dragAction === null || dragStartCellState === null || dragStartRow === null || dragStartCol === null) return;

  const r = Math.floor(i / state.cols);
  const c = i % state.cols;

  // QoL: Limit drag to the row and column of the initial cell
  if (r !== dragStartRow && c !== dragStartCol) return;

  // QoL: Drag only changes cells of the same type as the starting one
  if (state.grid[i] !== dragStartCellState) return;

  const newVal = dragAction === 'clear' ? 0 : dragAction === 'fill' ? 1 : 2;
  if (state.grid[i] === newVal) return; // already this value during drag

  // Limit block placement
  if (newVal === 1 && state.grid[i] !== 1) {
    const targetBlocks = state.solution.filter((v) => v === 1).length;
    const currentBlocks = state.grid.filter((v) => v === 1).length;
    if (currentBlocks >= targetBlocks) {
      showToast(`Límite de bloques alcanzado (${targetBlocks}/${targetBlocks})`);
      return;
    }
  }

  state.grid[i] = newVal;
  renderCell(i);
  updateProgress();
}

// ─────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────

function renderCell(i: number): void {
  if (!state) return;
  const cell = boardEl.children[i] as HTMLElement;
  if (!cell) return;
  const v = state.grid[i];
  cell.classList.toggle('filled', v === 1);
  cell.classList.toggle('crossed', v === 2);
}

function renderAll(): void {
  if (!state) return;
  for (let i = 0; i < state.rows * state.cols; i++) renderCell(i);
  updateProgress();
}

function updateProgress(): void {
  if (!state) return;
  const solutionFilled = state.solution.filter((v) => v === 1).length;
  const playerFilled = state.grid.filter((v) => v === 1).length;
  const pct = Math.round((playerFilled / solutionFilled) * 100);
  progressLabelEl.textContent = `${playerFilled}/${solutionFilled} celdas (${pct}%)`;
  updateCluesStatus();
}

function getCompletedCluesLeft(line: number[], clues: number[]): boolean[] {
  const completed = new Array(clues.length).fill(false);
  let cellIdx = 0;
  const N = line.length;

  for (let k = 0; k < clues.length; k++) {
    // Skip crosses
    while (cellIdx < N && line[cellIdx] === 2) {
      cellIdx++;
    }
    if (cellIdx >= N) break;

    if (line[cellIdx] === 1) {
      let end = cellIdx;
      while (end < N && line[end] === 1) {
        end++;
      }
      const len = end - cellIdx;
      const lockedLeft = (cellIdx === 0 || line[cellIdx - 1] === 2);
      if (lockedLeft && len === clues[k]) {
        completed[k] = true;
        cellIdx = end;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return completed;
}

function getLineCompletedClues(line: number[], clues: number[]): boolean[] {
  if (clues.length === 1 && clues[0] === 0) {
    return [ !line.includes(1) ];
  }

  const completedLeft = getCompletedCluesLeft(line, clues);

  const reversedLine = line.slice().reverse();
  const reversedClues = clues.slice().reverse();
  const completedRightReversed = getCompletedCluesLeft(reversedLine, reversedClues);
  const completedRight = completedRightReversed.reverse();

  const completed = new Array(clues.length);
  for (let i = 0; i < clues.length; i++) {
    completed[i] = completedLeft[i] || completedRight[i];
  }
  return completed;
}

function updateCluesStatus(): void {
  if (!state) return;
  const { rows, cols, rowClues, colClues, grid } = state;

  // Update row clues
  for (let r = 0; r < rows; r++) {
    const rowLine = grid.slice(r * cols, r * cols + cols);
    const completed = getLineCompletedClues(rowLine, rowClues[r]);
    const cell = rowCluesEl.children[r] as HTMLElement;
    if (cell) {
      for (let k = 0; k < completed.length; k++) {
        const span = cell.children[k] as HTMLElement;
        if (span) {
          span.classList.toggle('completed', completed[k]);
        }
      }
    }
  }

  // Update column clues
  for (let c = 0; c < cols; c++) {
    const colLine = Array.from({ length: rows }, (_, r) => grid[r * cols + c]);
    const completed = getLineCompletedClues(colLine, colClues[c]);
    const cell = colCluesEl.children[c] as HTMLElement;
    if (cell) {
      for (let k = 0; k < completed.length; k++) {
        const span = cell.children[k] as HTMLElement;
        if (span) {
          span.classList.toggle('completed', completed[k]);
        }
      }
    }
  }
}

function updateTicket(): void {
  if (!state) return;
  seedLabelEl.textContent = '#' + state.seedLabel;
  sizeTagEl.textContent = SIZES[state.sizeKey].label;
}

// ─────────────────────────────────────────────
// Win
// ─────────────────────────────────────────────

function handleWin(): void {
  if (!state) return;
  state.solved = true;
  stopTimer();
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
  winStatsEl.textContent = `Tamaño ${SIZES[state.sizeKey].label} · semilla #${state.seedLabel} · tiempo ${formatTime(elapsed)}`;
  winOverlay.classList.add('show');
  updateCheckpointButtons();
}

function showErrorModal(errors: number): void {
  errorModalDescEl.textContent = `El tablero está completo pero contiene ${errors} ${errors === 1 ? 'celda incorrecta' : 'celdas incorrectas'}. Revisa tu solución.`;
  errorModalOverlay.classList.add('show');
}

function checkGameStatus(): void {
  if (!state || state.solved) return;
  const targetBlocks = state.solution.filter((v) => v === 1).length;
  const currentBlocks = state.grid.filter((v) => v === 1).length;
  
  if (currentBlocks === targetBlocks) {
    if (checkVictory(state.grid, state.solution)) {
      handleWin();
    } else {
      let errors = 0;
      for (let i = 0; i < state.solution.length; i++) {
        if (state.grid[i] === 1 && state.solution[i] !== 1) {
          errors++;
        }
      }
      showErrorModal(errors);
    }
  }
}

// ─────────────────────────────────────────────
// Tool selection
// ─────────────────────────────────────────────

function setTool(tool: 'fill' | 'cross'): void {
  if (!state) return;
  state.tool = tool;
  toolFillBtn.classList.toggle('active', tool === 'fill');
  toolCrossBtn.classList.toggle('active', tool === 'cross');
}

// ─────────────────────────────────────────────
// New game
// ─────────────────────────────────────────────

function newGame(sizeKey: SizeKey, seedNum: number, seedLabel: string | null): void {
  stopTimer();
  const puzzle = buildPuzzle(seedNum, sizeKey);
  state = {
    seedNum,
    seedLabel: seedLabel || String(seedNum),
    sizeKey,
    rows: puzzle.rows,
    cols: puzzle.cols,
    solution: puzzle.solution,
    grid: new Array(puzzle.rows * puzzle.cols).fill(0),
    rowClues: puzzle.rowClues,
    colClues: puzzle.colClues,
    tool: 'fill',
    solved: false,
    startTime: Date.now(),
    elapsedBeforeLoad: 0,
    history: [new Array(puzzle.rows * puzzle.cols).fill(0)],
    historyIndex: 0
  };
  buildBoard();
  renderAll();
  updateTicket();
  updateHistoryButtons();
  toolFillBtn.classList.add('active');
  toolCrossBtn.classList.remove('active');
  winOverlay.classList.remove('show');
  startTimer();
  updateCheckpointButtons();
}

function goToMainMenu(): void {
  stopTimer();
  clearCheckpoints();
  state = null;
  gameArea.classList.add('hidden');
  startMenu.classList.remove('hidden');
  winOverlay.classList.remove('show');
  errorModalOverlay.classList.remove('show');
  updateCheckpointButtons();
}

// ─────────────────────────────────────────────
// Menu size buttons
// ─────────────────────────────────────────────

function buildMenuSizeDOM(): void {
  menuSizeGrid.innerHTML = '';
  SIZE_ORDER.forEach((key) => {
    const b = document.createElement('button');
    b.className = 'diff-vertical-btn';
    const { label, rows, cols } = SIZES[key];
    b.innerHTML = `${label} <span class="size-hint">${cols}×${rows}</span>`;
    b.dataset.key = key;
    b.addEventListener('click', () => {
      selectedMenuSize = key;
      updateMenuSizeHighlight();
    });
    menuSizeGrid.appendChild(b);
  });
  updateMenuSizeHighlight();
}

function updateMenuSizeHighlight(): void {
  menuSizeGrid.querySelectorAll<HTMLButtonElement>('.diff-vertical-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.key === selectedMenuSize);
  });
}

// ─────────────────────────────────────────────
// Keyboard
// ─────────────────────────────────────────────

function handleKeyDown(e: KeyboardEvent): void {
  if (!state || state.solved) return;
  if (e.key === 'z' || e.key === 'Z') {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); undoMove(); }
  } else if (e.key === 'y' || e.key === 'Y') {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); redoMove(); }
  } else if (e.key === 'f' || e.key === 'F' || e.key === '1') {
    setTool('fill');
  } else if (e.key === 'x' || e.key === 'X' || e.key === '2') {
    setTool('cross');
  }
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

function initNonogram(): void {
  createHeader({ showBackButton: true, title: 'Nonograma' });
  buildMenuSizeDOM();

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  // Tool buttons
  toolFillBtn.addEventListener('click', () => setTool('fill'));
  toolCrossBtn.addEventListener('click', () => setTool('cross'));

  // Undo / Redo
  undoBtn.addEventListener('click', undoMove);
  redoBtn.addEventListener('click', redoMove);

  // Restart
  restartBtn.addEventListener('click', () => {
    if (!state || state.solved) return;
    showConfirmModal(
      'Reiniciar nonograma',
      '¿Estás seguro? Se perderá todo tu progreso en esta partida.',
      () => {
        if (!state) return;
        state.grid = new Array(state.rows * state.cols).fill(0);
        state.startTime = Date.now();
        state.elapsedBeforeLoad = 0;
        state.history = [state.grid.slice()];
        state.historyIndex = 0;
        renderAll();
        updateHistoryButtons();
        showToast('Nonograma restablecido.');
      }
    );
  });

  // Exit to menu
  exitBtn.addEventListener('click', () => {
    if (!state) return;
    if (state.solved) { goToMainMenu(); return; }
    showConfirmModal(
      'Salir al menú',
      '¿Estás seguro? Se perderá el progreso de la partida actual.',
      goToMainMenu
    );
  });

  // Start game
  startGameBtn.addEventListener('click', () => {
    const raw = menuSeedInput.value.trim();
    const seedNum = raw ? parseSeed(raw) : randomSeed();
    clearCheckpoints();
    startMenu.classList.add('hidden');
    gameArea.classList.remove('hidden');
    newGame(selectedMenuSize, seedNum, raw || null);
    menuSeedInput.value = '';
  });

  // Checkpoint: create
  createCpBtn.addEventListener('click', () => {
    if (!state || state.solved) return;
    const list = getCheckpoints();
    if (list.length >= 3) { showToast('Límite de 3 checkpoints alcanzado.'); return; }
    cpNameInput.value = `Checkpoint ${list.length + 1}`;
    createCpOverlay.classList.add('show');
  });

  cancelCpBtn.addEventListener('click', () => { createCpOverlay.classList.remove('show'); });

  saveCpBtn.addEventListener('click', () => {
    if (!state) return;
    const name = cpNameInput.value.trim();
    if (!name) { showToast('Escribe un nombre para el checkpoint.'); return; }
    const list = getCheckpoints();
    if (list.length >= 3) return;

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.elapsedBeforeLoad;
    const solutionFilled = state.solution.filter((v) => v === 1).length;
    const playerFilled = state.grid.filter((v) => v === 1).length;

    const cp: Checkpoint = {
      id: String(Date.now()),
      name,
      dateStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) +
               ' ' + new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      sizeKey: state.sizeKey,
      seedNum: state.seedNum,
      seedLabel: state.seedLabel,
      grid: state.grid.slice(),
      solution: state.solution.slice(),
      rowClues: state.rowClues,
      colClues: state.colClues,
      rows: state.rows,
      cols: state.cols,
      elapsedTime: elapsed,
      progress: `${playerFilled}/${solutionFilled}`
    };
    list.push(cp);
    saveCheckpoints(list);
    createCpOverlay.classList.remove('show');
    showToast('Checkpoint creado.');
  });

  // Checkpoint: load
  loadCpBtn.addEventListener('click', () => { renderCheckpointList(); loadCpOverlay.classList.add('show'); });
  closeCpBtn.addEventListener('click', () => { loadCpOverlay.classList.remove('show'); });

  // Win replay
  winReplayBtn.addEventListener('click', goToMainMenu);

  // Error modal close
  errorModalCloseBtn.addEventListener('click', () => {
    errorModalOverlay.classList.remove('show');
  });

  // Initial state
  updateCheckpointButtons();
}

document.addEventListener('DOMContentLoaded', initNonogram);
