# Especificación de Diseño: SourcePlay

Este documento detalla el diseño técnico, la arquitectura y el plan para el proyecto **SourcePlay**, una plataforma web que hostea múltiples minijuegos ejecutados en el navegador con HTML, CSS y TypeScript. 

El proyecto inicial migra el juego de Sudoku existente a TypeScript en un paquete aislado, establece una estructura de monorepo y crea un selector de juegos principal con un sistema de temas claro/oscuro unificado.

## 1. Arquitectura del Sistema

Implementaremos un monorepo utilizando **npm workspaces**. La navegación entre el selector principal y los juegos se realizará de forma directa (Navegación Directa) para optimizar la compatibilidad en dispositivos móviles.

### Estructura de Directorios

```text
sourceplay/
├── package.json                   # Configuración del monorepo y scripts globales
├── tsconfig.json                  # TSConfig base compartido
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-07-17-sourceplay-monorepo-design.md # Este documento
├── scripts/
│   └── assemble-build.js          # Script Node.js post-compilación para ensamblar producción
├── apps/
│   └── selector/                  # Portal/Selector de juegos principal
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.ts            # Lógica de renderizado del catálogo
│       │   └── style.css          # Estilos de la interfaz de selección
│       └── public/
│           └── assets/            # Activos estáticos del selector (cubierta de sudoku)
└── packages/
    ├── shared/                    # Librería y diseño compartido
    │   ├── package.json
    │   ├── style.css              # Variables de tema de color y reseteos globales
    │   └── src/
    │       ├── index.ts           # Punto de entrada de exports
    │       ├── theme.ts           # Módulo de control de temas
    │       └── header.ts          # Generador de cabecera común
    └── sudoku/                    # Minijuego de Sudoku migrado
        ├── index.html
        ├── package.json
        ├── vite.config.ts
        ├── src/
        │   ├── main.ts            # Punto de entrada de UI y ciclo de vida del juego
        │   ├── rng.ts             # Generador de números pseudoaleatorios con semilla
        │   ├── sudoku-core.ts     # Lógica algorítmica del Sudoku (resolución y generación)
        │   └── style.css          # Estilos del tablero e inputs adaptados al tema
```

---

## 2. Definición de Paquetes y Módulos

### A. Paquete Compartido (`@sourceplay/shared`)

Este paquete proporciona los estilos base del tema y utilidades para que todos los juegos se sientan parte de una misma plataforma.

*   **Tema Claro/Oscuro:**
    *   La preferencia predeterminada se tomará de la configuración del sistema/navegador utilizando la consulta de medios CSS `(prefers-color-scheme: dark)`.
    *   El usuario puede cambiar el tema manualmente mediante el switch de la cabecera. Esta elección se guarda en `localStorage` con la clave `sourceplay-theme`.
    *   Para evitar el parpadeo en la carga de página (*flashing*), `@sourceplay/shared` proveerá una función `initTheme()` que lee de inmediato el `localStorage` o el sistema e inyecta la clase CSS correcta (`.dark-theme` o `.light-theme`) en el elemento `<html>` antes de que finalice el renderizado del body.
*   **Cabecera Común (`createHeader`):**
    *   Inyecta dinámicamente una etiqueta `<header>` en el DOM de la aplicación que la invoque.
    *   Muestra el título "SourcePlay" que actúa como enlace al menú principal (`/`).
    *   Muestra un botón con icono SVG (sol/luna) para cambiar de tema.
    *   Si se especifica la opción `{ showBackButton: true }`, incluye un enlace de retroceso (`← Volver al selector`).

#### Paleta de Colores Compartida (Variables CSS)
```css
/* Valores por defecto: Tema Claro (Sketchbook/Papel crema original del Sudoku) */
:root, .light-theme {
  --paper: #ECE7D6;
  --paper-deep: #E1DAC3;
  --ink: #211F1A;
  --ink-soft: #6B6553;
  --navy: #233A5E;
  --teal: #0F6E64;
  --teal-deep: #0B564E;
  --amber: #E7B23A;
  --amber-soft: #F2E3B6;
  --same: #CFE7E1;
  --line: #B8AF93;
  --line-strong: #211F1A;
  --danger: #A3452E;
  --radius: 6px;
}

/* Tema Oscuro (Pizarra/Papel oscuro de alta legibilidad) */
.dark-theme {
  --paper: #1B1A17;
  --paper-deep: #262521;
  --ink: #ECE7D6;
  --ink-soft: #9E9885;
  --navy: #7FA6DE;
  --teal: #33ACA0;
  --teal-deep: #4DB6AC;
  --amber: #C99318;
  --amber-soft: #383428;
  --same: #223B36;
  --line: #4F4B3F;
  --line-strong: #ECE7D6;
  --danger: #E57373;
}
```

### B. Selector Principal (`@sourceplay/selector`)

La página web de entrada a SourcePlay. 
*   **Layout:** Muestra una cuadrícula de juegos responsiva adaptada para móviles y ordenadores.
*   **Registro Dinámico de Juegos:** Los juegos disponibles se configuran mediante una constante estricta de TypeScript:
    ```typescript
    export interface GameInfo {
      id: string;
      title: string;
      description: string;
      url: string;      // Enlace relativo, ej. './games/sudoku/index.html'
      imageUrl: string; // Enlace a la imagen de portada
    }
    ```
*   **Estilos:** Estética limpia y minimalista usando las variables de color globales. Las tarjetas de juego tienen micro-interacciones físicas (al hacer hover se desplazan y ganan sombra, al pulsar se "hunden" en el fondo reduciendo su sombra).

### C. Migración de Sudoku (`@sourceplay/sudoku`)

Se migrará el código javascript actual en `sudoku.html` a TypeScript estricto sin modificar la lógica interna ni alterar el diseño visual.

*   **`src/rng.ts`:**
    *   `mulberry32(a: number): () => number`
    *   `hashSeed(str: string): number`
*   **`src/sudoku-core.ts`:**
    *   `DIFFICULTIES`: Configuración de celdas por dificultad.
    *   `boxOf(r: number, c: number): number`
    *   `generateSolved(rng: () => number): number[]`
    *   `countSolutions(grid: number[], limit: number): number`
    *   `digHoles(solved: number[], rng: () => number, targetClues: number): number[]`
    *   `buildPuzzle(seedNum: number, difficultyKey: DifficultyKey): { solved: number[], puzzle: number[] }`
*   **`src/main.ts`:**
    *   Inicializa la cabecera común inyectando `createHeader({ showBackButton: true })`.
    *   Inicializa el tema mediante `initTheme()`.
    *   Lógica del bucle del juego, administración de estados, eventos del teclado del navegador y renderizado del DOM de las celdas y notas del Sudoku.
*   **Adaptación CSS (`src/style.css`):**
    *   El fondo del `body` del Sudoku utiliza el patrón de cuadrículas original, adaptando las líneas con opacidad sutil para que se visualicen correctamente tanto sobre el color crema en claro como sobre el negro carbón en oscuro.

---

## 3. Estrategia de Construcción y Despliegue

Cada subproyecto (`apps/selector`, `packages/sudoku`) compilará usando **Vite**. 

1.  **En desarrollo:** El desarrollador puede arrancar los servidores de desarrollo de Vite de forma aislada.
2.  **Compilación global (`build:all`):** Compila todos los subproyectos en sus respectivas carpetas `dist/`.
3.  **Ensamblado de Producción (`scripts/assemble-build.js`):**
    *   Crea la estructura de salida en la carpeta `apps/selector/dist/`.
    *   Toma los archivos resultantes de `@sourceplay/sudoku` (ubicados en `packages/sudoku/dist/`) y los copia en `apps/selector/dist/games/sudoku/`.
    *   Copia cualquier recurso de portada necesario en la carpeta de activos de selector.
    *   Esta estructura unificada permite el despliegue estático directo en cualquier servidor web sin requerir servicios dinámicos de Node.js en producción.

---

## 4. Plan de Verificación

*   **Compilación Estricta:** Comprobar que todos los paquetes compilen con el compilador TypeScript (`tsc`) sin errores de tipos.
*   **Sincronización de Temas:** Cambiar de tema en el selector y verificar que al entrar al Sudoku, este mantenga y muestre el mismo tema inmediatamente.
*   **Funcionamiento del Sudoku:** Verificar que el juego se pueda resolver, que las notas funcionen, que el temporizador corra, y que los controles por teclado y ratón sigan funcionando exactamente igual.
*   **Compatibilidad Móvil:** Comprobar la responsividad del menú selector y del Sudoku en diferentes anchos de pantalla mediante simulación de navegador.
