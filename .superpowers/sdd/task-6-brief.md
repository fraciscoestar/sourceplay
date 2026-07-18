### Task 6: Game Registry and Monorepo Integration

**Files:**
- Modify: `apps/selector/src/main.ts:12-28`

- [ ] **Step 1: Update Launcher Selector Games Registry**
  Open `apps/selector/src/main.ts` and add `sopa-de-letras` to `GAMES_REGISTRY`:
  ```typescript
  const GAMES_REGISTRY: GameInfo[] = [
    {
      id: 'sudoku',
      title: 'Sudoku',
      description: 'Resuelve sudokus clásicos con semillas personalizadas y cuatro niveles de dificultad.',
      url: import.meta.env.DEV ? 'http://localhost:5174/' : './games/sudoku/index.html',
      imageUrl: './assets/covers/sudoku.jpg'
    },
    {
      id: 'nonogram',
      title: 'Nonograma',
      description: 'Descubre el patrón oculto usando las pistas numéricas de filas y columnas. Cuatro tamaños disponibles.',
      url: import.meta.env.DEV ? 'http://localhost:5175/' : './games/nonogram/index.html',
      imageUrl: './assets/covers/nonogram.jpg'
    },
    {
      id: 'wordsearch',
      title: 'Sopa de letras',
      description: 'Encuentra las palabras ocultas en la cuadrícula en horizontal, vertical o diagonal.',
      url: import.meta.env.DEV ? 'http://localhost:5176/' : './games/wordsearch/index.html',
      imageUrl: './assets/covers/wordsearch.jpg'
    }
  ];
  ```

- [ ] **Step 2: Generate Cover Image for Word Search**
  Generate a placeholder/cover image for the game selector using `generate_image` or copy/generate an asset at `apps/selector/public/assets/covers/wordsearch.jpg` (or standard folder structure). Let's see if selector public contains assets.
  Run: `npx vite-node -e "console.log(require('fs').existsSync('apps/selector/public/assets/covers/sudoku.jpg'))"`
  Wait, let's verify if `apps/selector/public/assets/covers/` is where they are stored, or look it up.
  Let's verify by checking the contents of the image selector path. Let's see where `sudoku.jpg` is located.
  Let's run a search for `sudoku.jpg` in the workspace.
  `git grep sudoku.jpg` or `grep_search` will reveal it.

- [ ] **Step 3: Run final builds**
  Run: `npm run build:all`
  Verify that compiling succeeds for `@sourceplay/selector`, `@sourceplay/sudoku`, `@sourceplay/nonogram`, and `@sourceplay/wordsearch`.

- [ ] **Step 4: Launch local dev server and test manually**
  Run: `npm run dev`
  Open `http://localhost:5173` (selector port) and test:
  1. Click "Sopa de letras" card.
  2. Test starting game in Fácil, Medio, Difícil, Experto.
  3. Verify drag select, click select, word matching, timer, restart, and exit to menu.
