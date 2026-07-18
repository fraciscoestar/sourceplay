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
