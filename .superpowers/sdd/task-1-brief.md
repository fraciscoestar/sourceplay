### Task 1: Package Scaffolding & Monorepo Configuration

**Files:**
- Create: `packages/wordsearch/package.json`
- Create: `packages/wordsearch/tsconfig.json`
- Create: `packages/wordsearch/vite.config.ts`
- Create: `packages/wordsearch/index.html`
- Modify: `package.json` (Root)
- Modify: `scripts/assemble-build.js`

**Interfaces:**
- Produces: Scaffolding files for `@sourceplay/wordsearch` package, configuring compilation, Vite dev server, and build assembly paths.

- [ ] **Step 1: Create package.json for wordsearch**
  Write to `packages/wordsearch/package.json`:
  ```json
  {
    "name": "@sourceplay/wordsearch",
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

- [ ] **Step 2: Create tsconfig.json for wordsearch**
  Write to `packages/wordsearch/tsconfig.json`:
  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "moduleResolution": "node"
    },
    "include": ["src/**/*", "vite.config.ts"]
  }
  ```

- [ ] **Step 3: Create vite.config.ts for wordsearch**
  Write to `packages/wordsearch/vite.config.ts`:
  ```typescript
  import { defineConfig } from 'vite';

  export default defineConfig({
    server: {
      port: 5176
    }
  });
  ```

- [ ] **Step 4: Create basic index.html placeholder**
  Write to `packages/wordsearch/index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sopa de Letras — SourcePlay</title>
    <script type="module">
      import { initTheme } from '@sourceplay/shared';
      initTheme();
    </script>
  </head>
  <body>
    <div id="app">Sopa de Letras Scaffold</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
  </html>
  ```

- [ ] **Step 5: Create src/main.ts placeholder**
  Create directory `packages/wordsearch/src` and write to `packages/wordsearch/src/main.ts`:
  ```typescript
  import { createHeader } from '@sourceplay/shared';
  import './style.css';

  createHeader({ showBackButton: true });
  console.log('Wordsearch loaded');
  ```

- [ ] **Step 6: Create src/style.css placeholder**
  Write to `packages/wordsearch/src/style.css`:
  ```css
  @import "@sourceplay/shared/style.css";
  ```

- [ ] **Step 7: Register wordsearch in root package.json scripts**
  Modify `package.json` in the root folder to support wordsearch commands:
  ```json
  "dev": "concurrently \"npm run dev:selector\" \"npm run dev:sudoku\" \"npm run dev:nonogram\" \"npm run dev:wordsearch\"",
  "dev:wordsearch": "npm run dev --workspace=@sourceplay/wordsearch",
  ```

- [ ] **Step 8: Update assembly script**
  Modify `scripts/assemble-build.js` to include wordsearch:
  - Add path variables:
    ```javascript
    const wordsearchDist = path.join(__dirname, '../packages/wordsearch/dist');
    const targetWordsearchPath = path.join(selectorDist, 'games/wordsearch');
    ```
  - Add copying block:
    ```javascript
    if (fs.existsSync(wordsearchDist)) {
      console.log(`Copiando build de Sopa de letras de ${wordsearchDist} a ${targetWordsearchPath}...`);
      copyDirSync(wordsearchDist, targetWordsearchPath);
      console.log('¡Sopa de letras copiada con éxito!');
    } else {
      console.warn('Advertencia: Compilación de Sopa de letras no encontrada.');
    }
    ```

- [ ] **Step 9: Run install and build verify**
  Run: `npm install`
  Run: `npm run build:all`
  Verify that the build passes and files are created under `apps/selector/dist/games/wordsearch`.

---
