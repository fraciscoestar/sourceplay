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

