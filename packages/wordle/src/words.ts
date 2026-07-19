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
