# Palabra del Día Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Wordle and Letroso clone called "Palabra del Día" with support for custom seeds, accents mode, hidden word length mode, and time trial mode, integrated into the SourcePlay monorepo.

**Architecture:** A unified Vite + TypeScript SPA package `@sourceplay/wordle` that dynamically adjusts its rules and UI based on configurations. It uses a native hidden input for mobile keyboard compatibility, mulberry32 for deterministic random generation, and is compiled and copied into the final selector distribution.

**Tech Stack:** TypeScript, HTML5, Vanilla CSS, Vite, Node.js.

## Global Constraints
- **Accents**: Treat `Á, É, Í, Ó, Ú` as independent characters in accents mode; strip them in normal mode. Keep `Ñ` always.
- **Lengths**: Secret words must be between 4 and 10 characters, randomly selected based on the seed.
- **Keyboard**: Use native device keyboard (hidden input trick for mobile focus).
- **Time Trial**: 5 minutes countdown, Skip button, and skip penalty up to 30 seconds.
- **Themes**: Support clear-cut light-theme and dark-theme variables from `@sourceplay/shared`.
- **Git Commits**: Add and commit at the end of each task.

---

### Task 1: Scaffolding `@sourceplay/wordle` package

**Files:**
- Create: `packages/wordle/package.json`
- Create: `packages/wordle/tsconfig.json`
- Create: `packages/wordle/vite.config.ts`

**Interfaces:**
- Consumes: None
- Produces: Package build scripts and TS environment settings.

- [ ] **Step 1: Create package.json**
  Create `packages/wordle/package.json` with the following contents:
  ```json
  {
    "name": "@sourceplay/wordle",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build"
    },
    "dependencies": {
      "@sourceplay/shared": "*"
    }
  }
  ```

- [ ] **Step 2: Create tsconfig.json**
  Create `packages/wordle/tsconfig.json` with the following contents:
  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "moduleResolution": "node"
    },
    "include": ["src/**/*", "vite.config.ts"]
  }
  ```

- [ ] **Step 3: Create vite.config.ts**
  Create `packages/wordle/vite.config.ts` on port 5179:
  ```typescript
  import { defineConfig } from 'vite';

  export default defineConfig({
    base: './',
    server: {
      port: 5179
    }
  });
  ```

- [ ] **Step 4: Verify package setup**
  Run compilation from root to verify the package is recognized:
  Run: `npm run build --workspace=@sourceplay/wordle`
  Expected: Command finishes successfully (or shows missing src errors, but no configuration syntax errors).

- [ ] **Step 5: Commit scaffolding**
  Run:
  ```bash
  git add packages/wordle/package.json packages/wordle/tsconfig.json packages/wordle/vite.config.ts
  git commit -m "feat(wordle): scaffold packages/wordle configuration"
  ```

---

### Task 2: Create HTML Structure

**Files:**
- Create: `packages/wordle/index.html`

**Interfaces:**
- Consumes: `@sourceplay/shared` header styles and theme script.
- Produces: The HTML skeleton of the Start Menu and Game Area.

- [ ] **Step 1: Create index.html**
  Create `packages/wordle/index.html` with views for the menu and the play area, along with a hidden input for mobile keyboard activation.
  ```html
  <!DOCTYPE html>
  <html lang="es" class="sp-no-transition">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Palabra del Día — SourcePlay</title>
    <link class="game-stylesheet" rel="stylesheet" href="/src/style.css">
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
      <!-- START MENU -->
      <div id="startMenu" class="view">
        <header class="game-local-header">
          <h1>Palabra del Día</h1>
          <p class="menu-subtitle">Adivina la palabra secreta oculta</p>
        </header>

        <div class="menu-content">
          <div class="options-group">
            <label class="option-check">
              <input type="checkbox" id="menuTildesCheck">
              <span>Modo Tildes (Vocales con acentos importan)</span>
            </label>
            <label class="option-check">
              <input type="checkbox" id="menuHiddenLengthCheck">
              <span>Modo Difícil (Longitud oculta / Letroso)</span>
            </label>
            <label class="option-check">
              <input type="checkbox" id="menuTimeTrialCheck">
              <span>Modo Contrarreloj (5 minutos)</span>
            </label>
          </div>

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
          <h1 id="gameTitle">Palabra del Día</h1>
        </header>

        <div class="ticket">
          <div>Semilla&nbsp;<b id="seedLabel">—</b></div>
          <div id="scoreLabel" class="hidden">Aciertos: <b id="scoreCount">0</b></div>
          <div id="gameModeTags"></div>
        </div>

        <div class="board-wrap">
          <div id="attemptsContainer" class="attempts-container">
            <div id="board"></div>
          </div>
          <!-- Hidden input for typing on mobile -->
          <input type="text" id="hiddenInput" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" inputmode="text" style="position: absolute; opacity: 0; pointer-events: none; left: -9999px;">
        </div>

        <div class="controls">
          <div class="row-line" id="gameplayButtonsRow">
            <button class="btn ghost" id="skipWordBtn">Saltar Palabra</button>
            <button class="btn primary" id="revealWordBtn">Revelar Palabra</button>
          </div>
          <div class="row-line">
            <button class="btn primary" id="restartGameBtn">Reiniciar</button>
            <button class="btn ghost" id="exitToMenuBtn">Salir al menú</button>
          </div>

          <div class="status-row">
            <span id="wordStatusLabel">Intentos: 0</span>
            <span id="timer">00:00</span>
          </div>
        </div>
      </div>
    </div>

    <!-- NOTIFICATION TOAST -->
    <div class="toast" id="toast"></div>

    <!-- WIN/LOSS MODAL -->
    <div class="overlay" id="endGameOverlay">
      <div class="modal">
        <h2 id="modalTitle">¡Victoria!</h2>
        <p id="modalDesc"></p>
        <div class="row-line" style="margin-top: 18px; flex-direction: column; gap: 8px;">
          <button class="btn primary" id="modalNextBtn" style="margin-top: 0; width: 100%;">Siguiente Palabra</button>
          <button class="btn primary" id="modalReplayBtn" style="margin-top: 0; width: 100%;">Nueva Partida</button>
          <button class="btn ghost" id="modalHomeBtn" style="margin-top: 0; width: 100%;">Menú Principal</button>
        </div>
      </div>
    </div>

    <script type="module" src="/src/main.ts"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Commit HTML**
  Run:
  ```bash
  git add packages/wordle/index.html
  git commit -m "feat(wordle): add game index.html structure"
  ```

---

### Task 3: Word Dictionary and Random Generator (RNG)

**Files:**
- Create: `packages/wordle/src/words.ts`
- Create: `packages/wordle/src/rng.ts`

**Interfaces:**
- Consumes: `packages/wordsearch/src/words.ts` (`SPANISH_WORDS`)
- Produces:
  - `mulberry32(seed: number): () => number`
  - `parseSeed(str: string): number`
  - `randomSeed(): number`
  - `getSeededWord(rng: () => number, tildesMode: boolean): string`
  - `isValidWord(word: string): boolean`

- [ ] **Step 1: Implement rng.ts**
  Create `packages/wordle/src/rng.ts` with Mulberry32 PRNG and seed parsing logic:
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

- [ ] **Step 2: Implement words.ts**
  Create `packages/wordle/src/words.ts`. Import unaccented words from the `wordsearch` package, normalize them, and map our curated list of 4-10 letter words with their accents:
  ```typescript
  import { SPANISH_WORDS } from '../../wordsearch/src/words';

  // Accent mapping and removal helper
  export function removeAccents(str: string): string {
    const map: Record<string, string> = {
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'Ü': 'U', 'ü': 'u'
    };
    return str.replace(/[ÁÉÍÓÚáéíóúÜü]/g, (m) => map[m]);
  }

  // Curated list of common nouns, verbs, adjectives with correct accents (lengths 4 to 10)
  const ACCENTED_CURATED = [
    "CAFÉ", "BEBÉ", "SOFÁ", "MENÚ", "PAÍS", "RAÍZ", "ASÍ", "MÁS", "ALLÁ", "AQUÍ", "RÍO", "DÍA", "VÍA", "ÚTIL",
    "ÁRBOL", "AVIÓN", "JABÓN", "RATÓN", "LIMÓN", "MELÓN", "JAPÓN", "PARÍS", "UNIÓN", "RAZÓN", "ÁNGEL", "ÚNICO",
    "LÍNEA", "VÍDEO", "ÁLBUM", "TÚNEL", "MÓVIL", "FÁCIL", "DÓLAR", "HÉROE", "MÚSICA", "CÁMARA", "PÁGINA", "MÉDICO",
    "SÁBADO", "RÁPIDO", "MÁXIMO", "MÍNIMO", "ÚLTIMO", "LÓGICO", "FÍSICO", "QUÍMICO", "ÓPTIMO", "SÓLIDO", "LÍQUIDO",
    "CÓMODO", "TÉCNICO", "PÁJARO", "SÁBANA", "SÍLABA", "SÓTANO", "VÍCTIMA", "MÉTODO", "CRÍTICA", "CÓDIGO", "LÍDER",
    "CÁLIDO", "TÍMIDO", "RÍGIDO", "TEORÍA", "LÁMPARA", "BRÚJULA", "SÉPTIMO", "BÁRBARO", "CRÉDITO", "PÚBLICA",
    "MÁQUINA", "PLÁTANO", "DÉCIMO", "SÍMBOLO", "GRÁFICO", "CRÓNICA", "TRÁFICO", "FÓRMULA", "JÓVENES", "PLÁSTICO",
    "CÁLCULO", "TÉRMICA", "FÁBRICA", "SÍNTESIS", "PÁRPADO", "PELÍCULA", "TELÉFONO", "ARTÍCULO", "POLÍTICA", "PRÁCTICA",
    "SINFONÍA", "COMPAÑÍA", "GEOMETRÍA", "ANATOMÍA", "CANCIÓN", "ACCIÓN", "OPINIÓN", "DECISIÓN", "PRESIÓN", "TENSIÓN",
    "LECCIÓN", "NACIÓN", "REUNIÓN", "MISIÓN", "VISIÓN", "PASIÓN", "CORAZÓN", "ILUSIÓN", "OCASIÓN", "FUNCIÓN",
    "RELACIÓN", "SITUACIÓN", "CREACIÓN", "DIRECCIÓN", "EDUCACIÓN", "FORMACIÓN", "ATENCIÓN", "POSICIÓN", "PRODUCCIÓN",
    "OPERACIÓN", "REVOLUCIÓN", "ORGANIZACIÓN", "ADMINISTRACIÓN", "INVESTIGACIÓN", "PARTICIPACIÓN", "CONVERSACIÓN",
    "DECLARACIÓN", "OBSERVACIÓN", "TRANSFORMACIÓN"
  ];

  // List of common unaccented Spanish words (lengths 4 to 10)
  const UNACCENTED_CURATED = [
    "CASA", "MESA", "LAGO", "GATO", "TAZA", "ROJO", "AZUL", "GRIS", "VIDA", "AMOR", "DIOS", "TRES", "CADA", "HIJO",
    "ARTE", "BAJO", "BOCA", "CAJA", "CAMA", "CARA", "CINE", "COLA", "COPA", "DADO", "DEDO", "DUDA", "EDAD", "FOTO",
    "LUNA", "MANO", "MAPA", "NUBE", "OCHO", "OJOS", "PELO", "PISO", "ROCA", "SOPA", "TORO", "TREN", "VACA", "VASO",
    "VELA", "VINO", "ZONA", "LIBRO", "PERRO", "VERDE", "PLAYA", "ANTES", "NUEVO", "PADRE", "MUNDO", "NOCHE", "LUGAR",
    "CLARO", "PODER", "SABER", "TENER", "HACER", "DEBER", "DECIR", "PASAR", "VALOR", "PEDIR", "SALIR", "VIVIR",
    "CARTA", "GENTE", "COCHE", "RADIO", "FUEGO", "TIERRA", "AGUA", "MONTE", "CAMPO", "LLAVE", "PUNTO", "MARCO",
    "FORMA", "TIEMPO", "GRANDE", "CABEZA", "CAMINO", "CIUDAD", "CUERPO", "DIARIO", "ESTADO", "FAMILIA", "FUTURO",
    "IMAGEN", "MADERA", "MAÑANA", "MEDIDA", "MINUTO", "MOTIVO", "NÚMERO", "ORIGEN", "PAPELES", "PENSAR", "PUEBLO",
    "PUERTA", "SANGRE", "TRABAJO", "VERANO", "VIENTO", "FUERZA", "BLANCO", "SEMANA", "CARRERA", "DERECHO", "EMPRESA",
    "ESCUELA", "ESTRELLA", "HISTORIA", "IGLESIA", "JUSTICIA", "LIBERTAD", "MERCADO", "NEGOCIO", "PANTALLA", "PERSONA",
    "PROCESO", "RIQUEZA", "SEGUNDO", "SERVICIO", "VENTANA", "PROBLEMA", "PROYECTO", "PREGUNTA", "RESPUESTA",
    "ELEMENTO", "CONTRATO", "DISCURSO", "ESTUDIO", "ESFUERZO", "GOBIERNO", "MEDICINA", "NEGOCIOS", "PALABRAS",
    "RECURSOS", "SOCIEDAD"
  ];

  // Set of all normalized valid words from wordsearch for quick validation
  const VALIDATION_SET = new Set<string>();
  SPANISH_WORDS.forEach(w => {
    const norm = removeAccents(w).toUpperCase();
    if (norm.length >= 4 && norm.length <= 10) {
      VALIDATION_SET.add(norm);
    }
  });

  // Ensure all curated words are also in the validation set
  ACCENTED_CURATED.forEach(w => VALIDATION_SET.add(removeAccents(w).toUpperCase()));
  UNACCENTED_CURATED.forEach(w => VALIDATION_SET.add(removeAccents(w).toUpperCase()));

  export function isValidWord(word: string): boolean {
    const normalized = removeAccents(word).toUpperCase();
    return VALIDATION_SET.has(normalized);
  }

  export function getSeededWord(rng: () => number, tildesMode: boolean): string {
    if (tildesMode) {
      // Pick strictly from accented curated list
      const idx = Math.floor(rng() * ACCENTED_CURATED.length);
      return ACCENTED_CURATED[idx].toUpperCase();
    } else {
      // Combine both, but strip accents when playing in normal mode
      const combined = [...ACCENTED_CURATED, ...UNACCENTED_CURATED];
      const idx = Math.floor(rng() * combined.length);
      return removeAccents(combined[idx]).toUpperCase();
    }
  }
  ```

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit --workspace=@sourceplay/wordle`
  Expected: Command runs successfully.

- [ ] **Step 4: Commit RNG and word dictionary**
  Run:
  ```bash
  git add packages/wordle/src/rng.ts packages/wordle/src/words.ts
  git commit -m "feat(wordle): add Mulberry32 RNG and Spanish word dictionary"
  ```

---

### Task 4: Styling and Themes (CSS)

**Files:**
- Create: `packages/wordle/src/style.css`

**Interfaces:**
- Consumes: CSS variables from `@sourceplay/shared/style.css`
- Produces: CSS rules matching the paper aesthetic (light and dark themes).

- [ ] **Step 1: Create style.css**
  Create `packages/wordle/src/style.css`. Define the board cells, scrolling, input overlays, key highlights, and transitions:
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

  .menu-subtitle {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 2px 0 0;
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

  .ticket #gameModeTags {
    display: flex;
    gap: 4px;
  }

  .ticket .tag {
    background: var(--ink);
    color: var(--paper);
    padding: 1px 7px;
    border-radius: 3px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 9.5px;
    letter-spacing: 0.08em;
  }

  .board-wrap {
    position: relative;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 4px 0 -2px rgba(33,31,26,0.12);
    width: 100%;
    max-height: 48vh;
    height: 100%;
    margin: 0 auto;
    transition: background-color 0.25s ease, border-color 0.25s ease;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .attempts-container {
    flex-grow: 1;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
  }

  .attempts-container::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  #board {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .row-guess {
    display: flex;
    justify-content: center;
    gap: 6px;
    width: 100%;
  }

  .tile {
    width: 100%;
    max-width: 44px;
    aspect-ratio: 1;
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(16px, 4vw, 22px);
    font-weight: 700;
    text-transform: uppercase;
    background: var(--paper);
    color: var(--ink);
    user-select: none;
    transition: transform 0.1s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  /* Pop animation when typing */
  .tile.pop {
    transform: scale(1.1);
  }

  /* Tile result states */
  .tile.correct {
    background-color: var(--teal) !important;
    border-color: var(--teal-deep) !important;
    color: var(--paper) !important;
  }

  .tile.present {
    background-color: var(--amber) !important;
    border-color: var(--amber) !important;
    color: var(--paper) !important;
  }

  .tile.absent {
    background-color: var(--ink-soft) !important;
    border-color: var(--ink-soft) !important;
    color: var(--paper) !important;
    opacity: 0.8;
  }

  /* Letroso specialized borders */
  .tile.is-initial {
    border-top-left-radius: 14px !important;
    border-bottom-left-radius: 14px !important;
    border-left-width: 4px !important;
  }

  .tile.is-final {
    border-top-right-radius: 14px !important;
    border-bottom-right-radius: 14px !important;
    border-right-width: 4px !important;
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
    padding: 8px;
    cursor: pointer;
    flex: 1;
    text-transform: uppercase;
    transition: background 0.12s, color 0.12s, border-color 0.12s, transform 0.05s;
    text-align: center;
  }

  .btn:active {
    transform: translateY(1px);
  }

  .btn:disabled {
    opacity: 0.35 !important;
    pointer-events: none !important;
  }

  .btn.primary {
    background: var(--ink);
    color: var(--paper);
  }

  .btn.ghost {
    background: transparent;
  }

  .options-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .option-check {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    text-align: left;
    user-select: none;
  }

  .option-check input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--teal);
    cursor: pointer;
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
  }

  #timer {
    font-weight: 700;
    color: var(--ink);
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
    transition: opacity 0.25s, transform 0.25s;
    max-width: 90vw;
    text-align: center;
    z-index: 150;
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
    z-index: 200;
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
    max-width: 360px;
    width: 100%;
    text-align: center;
  }

  .modal h2 {
    font-family: 'Fraunces', serif;
    font-weight: 900;
    font-size: 26px;
    margin: 0 0 8px;
    color: var(--ink);
  }

  .modal p {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 4px 0;
    word-break: break-all;
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

  .hidden {
    display: none !important;
  }
  ```

- [ ] **Step 2: Commit CSS**
  Run:
  ```bash
  git add packages/wordle/src/style.css
  git commit -m "feat(wordle): add wordle styling for paper theme"
  ```

---

### Task 5: Core Typing Logic & Hidden Input Integration

**Files:**
- Create: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: `index.html` elements, `rng.ts`, `words.ts`
- Produces: Initial game lifecycle, keyboard/hidden input listeners.

- [ ] **Step 1: Implement basic scaffold of main.ts with input listeners**
  Create `packages/wordle/src/main.ts` with basic DOM elements and typing capture logic:
  ```typescript
  import { createHeader } from '@sourceplay/shared';
  import { mulberry32, parseSeed, randomSeed } from './rng';
  import { getSeededWord, isValidWord, removeAccents } from './words';

  // State
  let seedNum: number = 0;
  let prng: () => number;
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
        // In tildes mode, if they typed accented letter, keep it
        if (/[ÁÉÍÓÚ]/.test(upper)) return upper;
        return upper; // standard vowels
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

    hiddenInput.addEventListener('input', (e) => {
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
  ```

- [ ] **Step 2: Verify compiling main.ts**
  Run: `npx tsc --noEmit --workspace=@sourceplay/wordle`
  Expected: Command runs successfully.

- [ ] **Step 3: Commit inputs**
  Run:
  ```bash
  git add packages/wordle/src/main.ts
  git commit -m "feat(wordle): add typing handlers and basic main.ts structure"
  ```

---

### Task 6: Grid Rendering & Accent/Letroso Comparison Algorithm

**Files:**
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: Typing inputs, comparison properties.
- Produces: Visual grid of guesses, Letroso borders, and color coding.

- [ ] **Step 1: Replace stub rendering and add full comparison logic in main.ts**
  Modify `packages/wordle/src/main.ts` to implement full row creation, coloring, and rounded borders:
  ```typescript
  // Replace the stubs in main.ts:
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
  ```

- [ ] **Step 2: Implement submitGuess validation**
  ```typescript
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
  ```

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit --workspace=@sourceplay/wordle`
  Expected: Command runs successfully.

- [ ] **Step 4: Commit rendering algorithm**
  Run:
  ```bash
  git add packages/wordle/src/main.ts
  git commit -m "feat(wordle): implement Letroso rounded border rendering and guess coloring"
  ```

---

### Task 7: Game Lifecycle, Time Trial, and Stopwatch Timer

**Files:**
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: Game configuration settings.
- Produces: Countdown timers, Stopwatch counters, skip actions, and game init.

- [ ] **Step 1: Implement full setupGame and loadNextWord logic in main.ts**
  Replace stubs and complete game setup:
  ```typescript
  function startGame(): void {
    // Read config
    tildesMode = menuTildesCheck.checked;
    hiddenLengthMode = menuHiddenLengthCheck.checked;
    timeTrialMode = menuTimeTrialCheck.checked;
    
    const rawSeed = menuSeedInput.value.trim() || String(randomSeed());
    seedNum = parseSeed(rawSeed);
    prng = mulberry32(seedNum);
    
    guesses = [];
    currentGuess = '';
    isGameOver = false;
    score = 0;
    elapsedTime = 0;
    timeTrialRemaining = 300;
    
    // UI setup
    seedLabel.textContent = '#' + rawSeed;
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
    
    // Load first word
    loadNextWord();
    
    // Start timers
    startTimer();
    
    // Set focus
    setTimeout(() => hiddenInput.focus(), 50);
  }

  function loadNextWord(): void {
    secretWord = getSeededWord(prng, tildesMode);
    guesses = [];
    currentGuess = '';
    isGameOver = false;
    wordStartTime = Date.now(); // track start time of this word
    renderBoard();
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

  // Setup main view buttons
  startGameBtn.addEventListener('click', startGame);
  skipWordBtn.addEventListener('click', handleSkipWord);
  revealWordBtn.addEventListener('click', handleRevealWord);
  restartGameBtn.addEventListener('click', startGame);
  
  exitToMenuBtn.addEventListener('click', () => {
    stopTimer();
    gameArea.classList.add('hidden');
    startMenu.classList.remove('hidden');
  });

  modalHomeBtn.addEventListener('click', () => {
    endGameOverlay.classList.remove('show');
    gameArea.classList.add('hidden');
    startMenu.classList.remove('hidden');
  });

  modalReplayBtn.addEventListener('click', () => {
    endGameOverlay.classList.remove('show');
    startGame();
  });
  ```

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npx tsc --noEmit --workspace=@sourceplay/wordle`
  Expected: Command runs successfully.

- [ ] **Step 3: Commit timers and options logic**
  Run:
  ```bash
  git add packages/wordle/src/main.ts
  git commit -m "feat(wordle): implement Game loop, Contrarreloj mode, timers and skip penalties"
  ```

---

### Task 8: App Registration & Build Script Modifications

**Files:**
- Modify: `apps/selector/src/main.ts`
- Modify: `package.json`
- Modify: `scripts/assemble-build.js`

**Interfaces:**
- Consumes: The newly compiled `@sourceplay/wordle` distribution.
- Produces: The Wordle game entry in selector registry and monorepo build tasks.

- [ ] **Step 1: Add Wordle to apps/selector/src/main.ts**
  Register Wordle in selector registry:
  ```typescript
  // Find index.html or registry under apps/selector/src/main.ts, append Wordle:
  {
    id: 'wordle',
    title: 'Palabra del Día',
    description: 'Adivina la palabra secreta. Modos con tildes, longitud oculta y contrarreloj.',
    url: import.meta.env.DEV ? 'http://localhost:5179/' : './games/wordle/index.html',
    imageUrl: './assets/covers/wordle.jpg'
  }
  ```

- [ ] **Step 2: Add scripts to root package.json**
  Update `"dev"` and append `"dev:wordle"`:
  ```json
  "dev": "concurrently \"npm run dev:selector\" \"npm run dev:sudoku\" \"npm run dev:nonogram\" \"npm run dev:wordsearch\" \"npm run dev:sliding-puzzle\" \"npm run dev:lights-out\" \"npm run dev:wordle\"",
  "dev:wordle": "npm run dev --workspace=@sourceplay/wordle"
  ```

- [ ] **Step 3: Add copy command to scripts/assemble-build.js**
  Append Wordle bundling parameters:
  ```javascript
  const wordleDist = path.join(__dirname, '../packages/wordle/dist');
  const targetWordlePath = path.join(selectorDist, 'games/wordle');

  if (fs.existsSync(wordleDist)) {
    console.log(`Copiando build de Palabra del Día de ${wordleDist} a ${targetWordlePath}...`);
    copyDirSync(wordleDist, targetWordlePath);
    console.log('¡Palabra del Día copiada con éxito!');
  } else {
    console.warn('Advertencia: Compilación de Palabra del Día no encontrada.');
  }
  ```

- [ ] **Step 4: Verify monorepo builds completely**
  Run: `npm run build:all`
  Expected: Builds all packages (including `@sourceplay/wordle`) and runs `assemble` successfully.

- [ ] **Step 5: Commit workspace registration**
  Run:
  ```bash
  git add apps/selector/src/main.ts package.json scripts/assemble-build.js
  git commit -m "feat(wordle): register Wordle game in workspace apps and assembler"
  ```
