# Lights Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fully functional, seeded "Apaga las Luces" (Lights Out) game workspace package under `@sourceplay/lights-out`, complete with a GF(2) linear algebra solver for optimal path calculations, checkpointing, undo/redo, real-time hints, and a minimal paper design.

**Architecture:** Create a standalone package inside the NPM monorepo. The core mathematical logic is isolated in a solver module. The UI uses simple DOM bindings inside a single-page view controller that interfaces with `@sourceplay/shared` header and theme modules.

**Tech Stack:** TypeScript, Vite, Vanilla CSS, HTML5, Lucide SVG icons.

## Global Constraints
- Target workspace path: `packages/lights-out`
- Browser UI aspect ratio: Locked to 1:1, centered, styled matching other games.
- Visual Companion: Disabled (conceptual/mathematical alignment is already complete).
- Checkpoints storage: LocalStorage keyed with `sourceplay-lights-out-checkpoints` (max 3 slots).
- Dev port: `5178`.

---

### Task 1: Package Scaffolding & Monorepo Configuration

**Files:**
- Create: `packages/lights-out/package.json`
- Create: `packages/lights-out/tsconfig.json`
- Create: `packages/lights-out/vite.config.ts`
- Modify: `package.json` (Root)
- Modify: `apps/selector/src/main.ts`
- Modify: `scripts/assemble-build.js`

**Interfaces:**
- Consumes: None
- Produces: Package registration for dev and build runs

- [ ] **Step 1: Create package configuration**
  Create `packages/lights-out/package.json`:
  ```json
  {
    "name": "@sourceplay/lights-out",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build"
    },
    "dependencies": {
      "@sourceplay/shared": "*"
    }
  }
  ```

- [ ] **Step 2: Create TypeScript compiler config**
  Create `packages/lights-out/tsconfig.json`:
  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "moduleResolution": "node"
    },
    "include": ["src/**/*", "vite.config.ts"]
  }
  ```

- [ ] **Step 3: Create Vite server configuration**
  Create `packages/lights-out/vite.config.ts`:
  ```typescript
  import { defineConfig } from 'vite';

  export default defineConfig({
    server: {
      port: 5178
    }
  });
  ```

- [ ] **Step 4: Register in root package.json**
  Modify: `package.json` (Root). Add `"dev:lights-out": "npm run dev --workspace=@sourceplay/lights-out"` to scripts, and update the `"dev"` script to include it concurrently:
  ```json
  "dev": "concurrently \"npm run dev:selector\" \"npm run dev:sudoku\" \"npm run dev:nonogram\" \"npm run dev:wordsearch\" \"npm run dev:sliding-puzzle\" \"npm run dev:lights-out\"",
  ```

- [ ] **Step 5: Register in games selector main page**
  Modify: `apps/selector/src/main.ts` by adding Lights Out in the `GAMES_REGISTRY` array:
  ```typescript
    {
      id: 'lights-out',
      title: 'Apaga las Luces',
      description: 'Conmuta las luces de la cuadrícula hasta apagarlas todas en el menor número de movimientos.',
      url: import.meta.env.DEV ? 'http://localhost:5178/' : './games/lights-out/index.html',
      imageUrl: './assets/covers/lights-out.jpg'
    }
  ```

- [ ] **Step 6: Update assemble-build script**
  Modify: `scripts/assemble-build.js` to copy compilation assets to selector dist:
  ```javascript
  const lightsOutDist = path.join(__dirname, '../packages/lights-out/dist');
  const targetLightsOutPath = path.join(selectorDist, 'games/lights-out');

  if (fs.existsSync(lightsOutDist)) {
    console.log(`Copiando build de Apaga las Luces de ${lightsOutDist} a ${targetLightsOutPath}...`);
    copyDirSync(lightsOutDist, targetLightsOutPath);
    console.log('¡Apaga las Luces copiado con éxito!');
  } else {
    console.warn('Advertencia: Compilación de Apaga las Luces no encontrada.');
  }
  ```
  *(Add this right after sliding-puzzle steps, before printing completion message).*

- [ ] **Step 7: Run verification compile**
  Run command: `npm run build:all`
  Expected: Success without TS errors.

- [ ] **Step 8: Commit Scaffolding**
  Run:
  ```bash
  git add packages/lights-out/package.json packages/lights-out/tsconfig.json packages/lights-out/vite.config.ts package.json apps/selector/src/main.ts scripts/assemble-build.js
  git commit -m "chore: setup lights-out workspace scaffolding"
  ```

---

### Task 2: RNG and Core Mathematical Solver (TDD)

**Files:**
- Create: `packages/lights-out/src/rng.ts`
- Create: `packages/lights-out/src/lights-out-core.ts`
- Create: `packages/lights-out/src/test-solver.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `buildPuzzle(seedNum: number, difficultyKey: 'facil' | 'medio' | 'dificil' | 'experto'): LightsOutPuzzle`
  - `solveLightsOut(N: number, state: number[]): number[] | null`

- [ ] **Step 1: Create deterministic random generator module**
  Create `packages/lights-out/src/rng.ts`:
  ```typescript
  export function mulberry32(a: number): () => number {
    return function(): number {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  export function hashSeed(str: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  export function randomSeed(): number {
    return (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
  }

  export function parseSeed(str: string): number {
    const clean = str.trim();
    if (/^\d+$/.test(clean)) {
      return parseInt(clean, 10) >>> 0;
    }
    return hashSeed(clean);
  }
  ```

- [ ] **Step 2: Create Lights Out Core Solver**
  Create `packages/lights-out/src/lights-out-core.ts`:
  ```typescript
  import { mulberry32 } from './rng';

  export type DifficultyKey = 'facil' | 'medio' | 'dificil' | 'experto';

  export interface LightsOutPuzzle {
    initialState: number[]; // 1 = on, 0 = off
    optimalMoves: number;
    initialClicks: number[]; // Click configurations used during generation
    N: number;
  }

  export const SIZES = {
    facil: 4,
    medio: 5,
    dificil: 7,
    experto: 9
  };

  export const SIZES_LABELS: Record<DifficultyKey, string> = {
    facil: 'Fácil (4×4)',
    medio: 'Medio (5×5)',
    dificil: 'Difícil (7×7)',
    experto: 'Experto (9×9)'
  };

  /**
   * Solves Lights Out using Gaussian elimination and nullspace search over GF(2).
   * Returns binary click vector representing the optimal buttons to press.
   */
  export function solveLightsOut(N: number, state: number[]): number[] | null {
    const M = N * N;
    // Build augmented matrix M x (M + 1)
    const matrix: number[][] = Array.from({ length: M }, () => new Array(M + 1).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const idx = r * N + c;
        matrix[idx][idx] = 1;
        if (r > 0) matrix[idx][(r - 1) * N + c] = 1;
        if (r < N - 1) matrix[idx][(r + 1) * N + c] = 1;
        if (c > 0) matrix[idx][r * N + (c - 1)] = 1;
        if (c < N - 1) matrix[idx][r * N + (c + 1)] = 1;
        matrix[idx][M] = state[idx];
      }
    }

    // Gaussian Elimination
    const pivots = new Array(M).fill(-1);
    let rank = 0;
    for (let col = 0; col < M; col++) {
      let pivotRow = -1;
      for (let row = rank; row < M; row++) {
        if (matrix[row][col] === 1) {
          pivotRow = row;
          break;
        }
      }
      if (pivotRow === -1) continue;

      if (pivotRow !== rank) {
        const temp = matrix[rank];
        matrix[rank] = matrix[pivotRow];
        matrix[pivotRow] = temp;
      }

      pivots[col] = rank;

      for (let row = 0; row < M; row++) {
        if (row !== rank && matrix[row][col] === 1) {
          for (let c = col; c <= M; c++) {
            matrix[row][c] ^= matrix[rank][c];
          }
        }
      }
      rank++;
    }

    // Check Solvability
    for (let row = rank; row < M; row++) {
      if (matrix[row][M] === 1) {
        return null; // Unsolvable
      }
    }

    // Particular Solution
    const y0 = new Array(M).fill(0);
    for (let col = 0; col < M; col++) {
      const pRow = pivots[col];
      if (pRow !== -1) {
        y0[col] = matrix[pRow][M];
      }
    }

    // Identify free variables to build nullspace basis
    const freeVars: number[] = [];
    for (let col = 0; col < M; col++) {
      if (pivots[col] === -1) {
        freeVars.push(col);
      }
    }

    const basis: number[][] = [];
    for (const freeCol of freeVars) {
      const vec = new Array(M).fill(0);
      vec[freeCol] = 1;
      for (let col = 0; col < M; col++) {
        const pRow = pivots[col];
        if (pRow !== -1) {
          vec[col] = matrix[pRow][freeCol];
        }
      }
      basis.push(vec);
    }

    // Find combination of nullspace vectors that minimizes click count (Hamming weight)
    let bestSolution = [...y0];
    let minWeight = y0.reduce((sum, val) => sum + val, 0);

    const numCombinations = 1 << basis.length;
    for (let i = 1; i < numCombinations; i++) {
      const current = [...y0];
      for (let j = 0; j < basis.length; j++) {
        if ((i >> j) & 1) {
          for (let idx = 0; idx < M; idx++) {
            current[idx] ^= basis[j][idx];
          }
        }
      }
      const weight = current.reduce((sum, val) => sum + val, 0);
      if (weight < minWeight) {
        minWeight = weight;
        bestSolution = current;
      }
    }

    return bestSolution;
  }

  /**
   * Generates a guaranteed solvable Lights Out board using random clicks.
   */
  export function buildPuzzle(seedNum: number, difficultyKey: DifficultyKey): LightsOutPuzzle {
    const N = SIZES[difficultyKey];
    const M = N * N;
    const rng = mulberry32(seedNum);

    let initialState = new Array(M).fill(0);
    let initialClicks = new Array(M).fill(0);

    let attempts = 0;
    while (attempts < 100) {
      initialClicks = new Array(M).fill(0);
      initialState = new Array(M).fill(0);

      for (let i = 0; i < M; i++) {
        initialClicks[i] = rng() < 0.5 ? 1 : 0;
      }

      for (let i = 0; i < M; i++) {
        if (initialClicks[i] === 1) {
          const r = Math.floor(i / N);
          const c = i % N;
          initialState[i] ^= 1;
          if (r > 0) initialState[(r - 1) * N + c] ^= 1;
          if (r < N - 1) initialState[(r + 1) * N + c] ^= 1;
          if (c > 0) initialState[r * N + (c - 1)] ^= 1;
          if (c < N - 1) initialState[r * N + (c + 1)] ^= 1;
        }
      }

      const activeCount = initialState.reduce((sum, val) => sum + val, 0);
      if (activeCount > 0) {
        break;
      }
      attempts++;
    }

    const optimalSol = solveLightsOut(N, initialState);
    const optimalMoves = optimalSol ? optimalSol.reduce((sum, val) => sum + val, 0) : 0;

    return { initialState, optimalMoves, initialClicks, N };
  }
  ```

- [ ] **Step 3: Create automated verification test script**
  Create `packages/lights-out/src/test-solver.ts`:
  ```typescript
  import { solveLightsOut, buildPuzzle } from './lights-out-core';

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  console.log("Running solver mathematical checks...");

  // 1. Solve basic unsolvable/solvable cases
  // A simple 2x2 grid (N=2) which toggle cell and neighbors.
  // Click matrix A for 2x2:
  // [ 1 1 1 0 ]
  // [ 1 1 0 1 ]
  // [ 1 0 1 1 ]
  // [ 0 1 1 1 ]
  // All rows sum to 1 + 1 + 1 = 3 = 1.
  const solvedState = [0, 0, 0, 0];
  const clicks = solveLightsOut(2, solvedState);
  assert(clicks !== null && clicks.reduce((s, v) => s + v, 0) === 0, "Empty board should take 0 clicks");

  const singleOn = [1, 0, 0, 0];
  const singleClicks = solveLightsOut(2, singleOn);
  assert(singleClicks !== null, "2x2 single cell ON is solvable");

  // 2. Verification of optimal move calculations for all sizes
  const sizes: ('facil' | 'medio' | 'dificil' | 'experto')[] = ['facil', 'medio', 'dificil', 'experto'];
  for (const sz of sizes) {
    const puzzle = buildPuzzle(12345, sz);
    console.log(`- Difficulty ${sz} (N=${puzzle.N}): optimal moves = ${puzzle.optimalMoves}`);
    
    // Verify that applying the optimal clicks to initial state clears the board
    const N = puzzle.N;
    const current = [...puzzle.initialState];
    const optClicks = solveLightsOut(N, current);
    assert(optClicks !== null, `Puzzle of size ${N} must be solvable`);

    // Simulate clicking the solved output
    for (let i = 0; i < optClicks!.length; i++) {
      if (optClicks![i] === 1) {
        const r = Math.floor(i / N);
        const c = i % N;
        current[i] ^= 1;
        if (r > 0) current[(r - 1) * N + c] ^= 1;
        if (r < N - 1) current[(r + 1) * N + c] ^= 1;
        if (c > 0) current[r * N + (c - 1)] ^= 1;
        if (c < N - 1) current[r * N + (c + 1)] ^= 1;
      }
    }
    const sum = current.reduce((s, v) => s + v, 0);
    assert(sum === 0, `Applying optimal clicks should completely turn off all lights for size ${N}`);
  }

  console.log("ALL MATHEMATICAL TESTS PASSED!");
  ```

- [ ] **Step 4: Execute TDD Tests**
  Run: `npx tsx packages/lights-out/src/test-solver.ts`
  Expected: "ALL MATHEMATICAL TESTS PASSED!" output.

- [ ] **Step 5: Commit TDD Core**
  Run:
  ```bash
  git add packages/lights-out/src/rng.ts packages/lights-out/src/lights-out-core.ts packages/lights-out/src/test-solver.ts
  git commit -m "feat: add RNG, linear algebra solver, and verification tests for Lights Out"
  ```

---

### Task 3: HTML Markup & Minimal Paper Stylesheet

**Files:**
- Create: `packages/lights-out/index.html`
- Create: `packages/lights-out/src/style.css`

**Interfaces:**
- Consumes: `@sourceplay/shared`
- Produces: Graphical interface layouts and styles

- [ ] **Step 1: Create index.html markup**
  Create `packages/lights-out/index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="es" class="sp-no-transition">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apaga las Luces — SourcePlay</title>
    <link rel="stylesheet" href="/src/style.css">
    <script>
      (function() {
        try {
          var params = new URLSearchParams(window.location.search);
          var themeParam = params.get('theme');
          if (themeParam === 'dark' || themeParam === 'light') {
            localStorage.setItem('sourceplay-theme', themeParam);
          }
        } catch (e) {}
        var savedTheme = localStorage.getItem('sourceplay-theme');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
          document.documentElement.classList.add('dark-theme');
          document.documentElement.classList.remove('light-theme');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.add('light-theme');
          document.documentElement.classList.remove('dark-theme');
          document.documentElement.style.colorScheme = 'light';
        }
      })();
    </script>
    <script type="module">
      import { initTheme } from '@sourceplay/shared';
      initTheme();
    </script>
  </head>
  <body>
    <div class="app">
      <!-- INICIO MENU -->
      <div id="startMenu" class="view">
        <header class="game-local-header">
          <h1>Apaga las Luces</h1>
          <p class="menu-subtitle">Conmuta las celdas hasta apagarlas todas</p>
        </header>

        <div class="menu-content">
          <div class="diff-vertical-grid" id="menuDiffGrid"></div>

          <div class="seed-section">
            <span class="seed-label">Semilla personalizada (opcional):</span>
            <input type="text" id="menuSeedInput" placeholder="Escribe una semilla propia…">
          </div>

          <button class="btn primary bold-btn" id="startGameBtn">Empezar Partida</button>
        </div>
      </div>

      <!-- PLAY AREA -->
      <div id="gameArea" class="view hidden">
        <header class="game-local-header">
          <h1>Apaga las Luces</h1>
        </header>

        <div class="ticket">
          <span>Semilla&nbsp;<b id="seedLabel">—</b></span>
          <span class="diff-tag" id="diffTag">—</span>
        </div>

        <div class="board-wrap">
          <div id="board"></div>
          <div class="loading-veil" id="loadingVeil">Generando tablero…</div>
        </div>

        <div class="controls">
          <!-- ACTIONS ROW: Undo, Redo, Save Checkpoint, Load Checkpoint, Hint (rightmost) -->
          <div class="row-line">
            <button class="btn icon-btn tooltip" id="undoBtn" disabled data-tooltip="Deshacer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </button>
            <button class="btn icon-btn tooltip" id="redoBtn" disabled data-tooltip="Rehacer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
            </button>
            <button class="btn icon-btn tooltip" id="createCheckpointBtn" data-tooltip="Crear Checkpoint">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><line x1="12" x2="12" y1="7" y2="13"/><line x1="9" x2="15" y1="10" y2="10"/></svg>
            </button>
            <button class="btn icon-btn tooltip" id="gameLoadCheckpointBtn" data-tooltip="Cargar Checkpoint">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button class="btn icon-btn tooltip" id="hintBtn" data-tooltip="Pista">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
          </div>

          <!-- RESTART / EXIT ROW -->
          <div class="row-line">
            <button class="btn primary" id="restartGameBtn">Reiniciar</button>
            <button class="btn ghost" id="exitToMenuBtn">Salir al menú</button>
          </div>

          <div class="status-row">
            <span id="movesLabel">Movimientos: 0</span>
            <span id="timer">00:00</span>
          </div>
        </div>
      </div>
    </div>

    <!-- NOTIFICATION TOAST -->
    <div class="toast" id="toast"></div>

    <!-- CREATE CHECKPOINT MODAL -->
    <div class="overlay" id="createCheckpointOverlay">
      <div class="modal">
        <h2>Guardar Partida</h2>
        <p>Escribe un nombre para este checkpoint (Máximo 3 guardados):</p>
        <input type="text" id="checkpointNameInput" placeholder="Mi partida guardada..." maxlength="20">
        <div class="row-line" style="margin-top: 18px;">
          <button class="btn" id="cancelCreateCheckpointBtn">Cancelar</button>
          <button class="btn primary" id="saveCheckpointBtn">Guardar</button>
        </div>
      </div>
    </div>

    <!-- LOAD CHECKPOINT MODAL -->
    <div class="overlay" id="loadCheckpointOverlay">
      <div class="modal" style="max-width: 400px; width: 90%;">
        <h2>Cargar Partida</h2>
        <div id="checkpointList"></div>
        <button class="btn" id="closeLoadCheckpointBtn" style="width: 100%; margin-top: 10px;">Cerrar</button>
      </div>
    </div>

    <!-- CONFIRM DIALOG -->
    <div class="overlay" id="confirmOverlay">
      <div class="modal">
        <h2 id="confirmTitle">¿Confirmar acción?</h2>
        <p id="confirmDesc">Se perderá el progreso de la partida actual.</p>
        <div class="row-line" style="margin-top: 18px;">
          <button class="btn" id="confirmCancelBtn">Cancelar</button>
          <button class="btn primary" id="confirmOkBtn">Confirmar</button>
        </div>
      </div>
    </div>

    <!-- WIN SCREEN -->
    <div class="overlay" id="winOverlay">
      <div class="modal">
        <h2>¡Resuelto!</h2>
        <p id="winStats"></p>
        <p id="winOptimalStats" style="font-size: 11.5px; margin-top: 6px;"></p>
        <div class="row-line" style="margin-top: 18px; flex-direction: column; gap: 8px;">
          <button class="btn primary" id="winRestartBtn" style="margin-top: 0; width: 100%;">Reiniciar Partida</button>
          <button class="btn primary" id="winReplayBtn" style="margin-top: 0; width: 100%;">Nueva Partida</button>
          <button class="btn ghost" id="winHomeBtn" style="margin-top: 0; width: 100%;">Menú Principal</button>
        </div>
      </div>
    </div>

    <script type="module" src="/src/main.ts"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Create stylesheet**
  Create `packages/lights-out/src/style.css`. It inherits from `@sourceplay/shared/style.css` and sets specific Lights Out aesthetics. Active switches are styled using double borders (`border-style: double`) and an amber/warm tone, while inactive switches are styled flat:
  ```css
  @import "@sourceplay/shared/style.css";

  html, body {
    overflow: hidden;
    height: 100%;
  }

  body {
    background:
      repeating-linear-gradient(0deg, rgba(33,31,26,0.035) 0px, rgba(33,31,26,0.035) 1px, transparent 1px, transparent 28px),
      repeating-linear-gradient(90deg, rgba(33,31,26,0.035) 0px, rgba(33,31,26,0.035) 1px, transparent 1px, transparent 28px),
      var(--paper);
    color: var(--ink);
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  .app {
    width: 100%;
    max-width: 440px;
    padding: 0 14px;
    height: calc(100dvh - 76px);
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    min-height: 0;
    overflow: hidden;
  }

  .game-local-header {
    text-align: center;
    margin-bottom: 2px;
  }

  .game-local-header h1 {
    font-family: 'Fraunces', serif;
    font-weight: 900;
    font-size: clamp(24px, 5.5vh, 32px);
    margin: 0;
    letter-spacing: -0.01em;
    color: var(--ink);
    transition: color 0.25s ease;
  }

  .ticket {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--paper-deep);
    border: 1.5px dashed var(--ink-soft);
    border-radius: 4px;
    padding: 5px 12px;
    margin: 4px 0 6px;
    font-size: 11px;
    letter-spacing: 0.03em;
    transition: background-color 0.25s ease, border-color 0.25s ease;
  }

  .ticket b {
    color: var(--teal-deep);
    transition: color 0.25s ease;
  }

  .ticket .diff-tag {
    background: var(--ink);
    color: var(--paper);
    padding: 1px 7px;
    border-radius: 3px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 9.5px;
    letter-spacing: 0.08em;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  .board-wrap {
    position: relative;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 4px 0 -2px rgba(33,31,26,0.12);
    width: 100%;
    max-width: min(100%, 39vh);
    margin: 0 auto;
    transition: background-color 0.25s ease, border-color 0.25s ease;
  }

  #board {
    display: grid;
    width: 100%;
    gap: 4px;
    grid-template-columns: repeat(var(--cols, 4), 1fr);
    grid-template-rows: repeat(var(--rows, 4), 1fr);
    aspect-ratio: 1;
  }

  .tile {
    position: relative;
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.05s ease;
    user-select: none;
  }

  .tile:active {
    transform: scale(0.95);
  }

  /* OFF light styling: flat, paper-deep */
  .tile.light-off {
    background: var(--paper-deep);
  }

  /* ON light styling: retro double-border with amber shade */
  .tile.light-on {
    background: var(--amber);
    border-width: 4px;
    border-style: double;
  }

  /* Flashing indicator for hint */
  .tile.hint-flash {
    animation: flashHint 0.5s ease-in-out 3;
  }

  @keyframes flashHint {
    0%, 100% { border-color: var(--ink); box-shadow: none; }
    50% { border-color: var(--danger); box-shadow: 0 0 12px var(--danger); }
  }

  .controls {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .row-line {
    display: flex;
    gap: 8px;
    margin-bottom: 0px;
  }

  .btn {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    font-size: 11.5px;
    letter-spacing: 0.03em;
    border: 2px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    flex: 1;
    text-transform: uppercase;
    transition: background 0.12s, color 0.12s, border-color 0.12s, transform 0.05s;
  }

  .btn:active {
    transform: translateY(1px);
  }

  .btn.primary {
    background: var(--ink);
    color: var(--paper);
  }

  .btn.ghost {
    background: transparent;
  }

  .diff-vertical-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    margin-bottom: 12px;
  }

  .diff-vertical-btn {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 10px;
    border: 2px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    border-radius: var(--radius);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.05s;
    text-align: center;
  }

  .diff-vertical-btn:active {
    transform: translateY(1px);
  }

  .diff-vertical-btn.active {
    background: var(--ink);
    color: var(--paper);
  }

  .seed-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
    text-align: left;
  }

  .seed-label {
    font-size: 11px;
    color: var(--ink-soft);
    font-weight: 700;
    transition: color 0.25s ease;
  }

  .seed-section input {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    padding: 8px 10px;
    background: var(--paper);
    color: var(--ink);
    width: 100%;
    transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
  }

  .seed-section input::placeholder {
    color: var(--ink-soft);
  }

  .bold-btn {
    font-size: 13px;
    padding: 10px;
    margin-bottom: 4px;
    font-weight: 700;
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2px;
    font-size: 11px;
    color: var(--ink-soft);
    transition: color 0.25s ease;
  }

  #timer {
    font-weight: 700;
    color: var(--ink);
    transition: color 0.25s ease;
  }

  .toast {
    position: fixed;
    left: 50%;
    bottom: 22px;
    transform: translate(-50%, 20px);
    background: var(--ink);
    color: var(--paper);
    padding: 10px 16px;
    border-radius: 5px;
    font-size: 12.5px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s, transform 0.25s, background-color 0.25s ease, color 0.25s ease;
    max-width: 90vw;
    text-align: center;
    z-index: 50;
  }

  .toast.show {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(33, 31, 26, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
    padding: 20px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }

  .overlay.show {
    opacity: 1;
    pointer-events: auto;
  }

  .modal {
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 6px;
    padding: 26px 22px;
    max-width: 340px;
    text-align: center;
    transition: background-color 0.25s ease, border-color 0.25s ease;
  }

  .modal h2 {
    font-family: 'Fraunces', serif;
    font-weight: 900;
    font-size: 26px;
    margin: 0 0 8px;
    color: var(--ink);
    transition: color 0.25s ease;
  }

  .modal p {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 4px 0;
    transition: color 0.25s ease;
  }

  .modal .btn {
    margin-top: 14px;
    width: 100%;
  }

  .loading-veil {
    position: absolute;
    inset: 0;
    background: rgba(236, 231, 214, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s;
    border-radius: 4px;
    color: var(--ink);
  }

  .loading-veil.show {
    opacity: 1;
  }

  .dark-theme .loading-veil {
    background: rgba(27, 26, 23, 0.85);
  }

  .view {
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-evenly;
  }

  .view.hidden {
    display: none !important;
  }

  .menu-subtitle {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 2px 0 0;
    transition: color 0.25s ease;
  }

  .modal input[type="text"] {
    width: 100%;
    margin-top: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    padding: 8px;
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    transition: background-color 0.25s, color 0.25s, border-color 0.25s;
  }

  #checkpointList {
    margin: 14px 0;
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
  }

  .checkpoint-card {
    border: 2px solid var(--ink);
    background: var(--paper-deep);
    border-radius: var(--radius);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: background-color 0.25s, border-color 0.25s;
  }

  .checkpoint-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed var(--ink-soft);
    padding-bottom: 4px;
    transition: border-color 0.25s;
  }

  .checkpoint-card-name {
    font-weight: 700;
    font-size: 12px;
    color: var(--ink);
    transition: color 0.25s;
  }

  .checkpoint-card-date {
    font-size: 10px;
    color: var(--ink-soft);
    transition: color 0.25s;
  }

  .checkpoint-card-details {
    font-size: 11px;
    color: var(--ink-soft);
    transition: color 0.25s;
  }

  .checkpoint-card-actions {
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  .checkpoint-btn {
    padding: 4px 10px;
    font-size: 10px;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    text-transform: uppercase;
    border: 2px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  }

  .checkpoint-btn.primary {
    background: var(--ink);
    color: var(--paper);
  }

  button:disabled {
    opacity: 0.35 !important;
    pointer-events: none !important;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
    height: 34px;
  }

  .icon-btn svg {
    width: 17px;
    height: 17px;
    stroke: currentColor;
  }

  .tooltip {
    position: relative;
  }

  .tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 130%;
    left: 50%;
    transform: translate(-50%, 4px) scale(0.9);
    background: var(--ink);
    color: var(--paper);
    padding: 5px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-family: 'Space Mono', monospace;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    z-index: 100;
    box-shadow: 0 4px 10px rgba(0,0,0,0.18);
    border: 1px solid var(--line-strong);
  }

  .tooltip:hover::after {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }

  .tooltip::before {
    content: '';
    position: absolute;
    bottom: 115%;
    left: 50%;
    transform: translate(-50%, 4px);
    border-width: 5px;
    border-style: solid;
    border-color: var(--ink) transparent transparent transparent;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    z-index: 100;
  }

  .tooltip:hover::before {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  ```

- [ ] **Step 3: Commit HTML/CSS**
  Run:
  ```bash
  git add packages/lights-out/index.html packages/lights-out/src/style.css
  git commit -m "feat: design lights-out DOM elements and stylesheet theme"
  ```

---

### Task 4: Main View Controller, History & Checkpoints

**Files:**
- Create: `packages/lights-out/src/main.ts`

**Interfaces:**
- Consumes: `@sourceplay/shared`
- Consumes: `rng.ts`
- Consumes: `lights-out-core.ts`
- Produces: Complete interactive game runtime

- [ ] **Step 1: Write controller code**
  Create `packages/lights-out/src/main.ts` covering starting selectors, timer operations, tile toggle handlers, undo/redo state stack, hints highlighter triggers, and checkpoint persistency operations:
  ```typescript
  import { createHeader } from '@sourceplay/shared';
  import { parseSeed, randomSeed } from './rng';
  import { DifficultyKey, SIZES, SIZES_LABELS, buildPuzzle, solveLightsOut } from './lights-out-core';

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
  ```

- [ ] **Step 2: Commit Main logic**
  Run:
  ```bash
  git add packages/lights-out/src/main.ts
  git commit -m "feat: complete main controller bindings and gameplay flow"
  ```

---

### Task 5: Monorepo Integration & End-to-End Build Verification

**Files:**
- Modify: `packages/lights-out/tsconfig.json` (Verify compilation output)

**Interfaces:**
- Consumes: All files
- Produces: Integrated build ready for selector homepage assembly

- [ ] **Step 1: Run complete build**
  Run: `npm run build:all`
  Expected: All packages compiled successfully and selector workspace assembled.

- [ ] **Step 2: Start workspace dev servers**
  Run: `npm run dev`
  Expected: Output showing all dev servers (selector, sudoku, nonogram, wordsearch, sliding-puzzle, lights-out) starting up correctly.

- [ ] **Step 3: Verification of homepage selection**
  - Load the dev selector homepage (port 5173).
  - Verify that "Apaga las Luces" card appears.
  - Click the card and verify redirection to Lights Out page (port 5178) passing the theme parameter.
  - Perform manual verification of difficulty layouts (4x4, 5x5, 7x7, 9x9), seed determinism, undo/redo, checkpoint slot boundaries, and hint animations.
