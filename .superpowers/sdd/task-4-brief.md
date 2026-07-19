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

