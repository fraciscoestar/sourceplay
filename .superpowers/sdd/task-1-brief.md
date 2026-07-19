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

