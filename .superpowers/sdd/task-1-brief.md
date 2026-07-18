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
