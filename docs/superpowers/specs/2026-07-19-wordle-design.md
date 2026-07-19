# Especificación de Diseño: Palabra del Día (Wordle/Letroso Clone)

**Fecha**: 2026-07-19  
**Estado**: Propuesto  

---

## 1. Introducción y Requisitos
Este documento describe el diseño técnico del nuevo juego **Palabra del Día** para la plataforma SourcePlay. El juego es un clon de Wordle y de Letroso (modo de longitud oculta) con soporte de semilla para juego competitivo, modo tildes y modo contrarreloj.

### Requisitos Clave:
* **Entrada de texto**: Uso exclusivo del teclado nativo del dispositivo (físico en ordenadores y teclado virtual del sistema operativo en móviles). Sin teclado en pantalla propio.
* **Control de caracteres**: Filtrar entradas no alfabéticas. Permitir `A-Z`, `Ñ`. Si el Modo Tildes está inactivo, normalizar automáticamente vocales acentuadas a su forma base (`á` -> `A`). Si está activo, tratar las tildes como caracteres independientes (`á` != `a`).
* **Longitudes de Palabra (determinada por la semilla entre 4 y 10 letras)**:
  * Si el **Modo Difícil (Longitud Oculta)** está **desactivado**: la longitud de la palabra secreta es visible. El jugador ve el número de casillas correspondientes a esa longitud (ej. 6 casillas si la palabra es de 6 letras) y todas sus conjeturas deben tener esa longitud exacta.
  * Si el **Modo Difícil (Longitud Oculta)** está **activado**: la longitud de la palabra secreta no se muestra. El jugador puede ingresar conjeturas de cualquier longitud entre 4 y 10 letras.
* **Modo Difícil (Longitud Oculta)**: No mostrar el tamaño de la palabra. Las casillas inicial y final coloreadas de verde se estilizan con bordes redondeados en los extremos para indicar el principio y fin de la palabra secreta (estilo Letroso).
* **Modo Contrarreloj**: 5 minutos de tiempo límite. El jugador intenta adivinar tantas palabras como sea posible en secuencia, determinada por la semilla. 
  * **Penalización por salto**: Si se salta una palabra habiendo estado en ella menos de 30 segundos, se descuenta la diferencia (`30 - tiempo_empleado`) del temporizador del juego.
* **Cronómetro**: Para partidas normales (sin tiempo límite), incluir un cronómetro incremental.
* **Estética**: Diseño estilo papel ("papel y tintero") con soporte completo para tema claro y oscuro usando las variables de `@sourceplay/shared`.
* **Scroll de intentos**: Apilado vertical de conjeturas con scroll automático hacia abajo en cada intento, ocultando visualmente la barra de desplazamiento.

---

## 2. Flujo de Datos y Diccionarios

### Diccionario y Validación
* **Validación**: Usaremos la lista unificada `SPANISH_WORDS` de `packages/wordsearch/src/words.ts` (9,388 palabras normalizadas). Para validar una palabra ingresada por el usuario:
  1. Se eliminan los acentos de la palabra ingresada.
  2. Se verifica si el resultado está en `SPANISH_WORDS` o en nuestra lista curada.
* **Palabras Secretas**: Mantendremos una lista de unas 600 palabras comunes de 4 a 10 letras en `packages/wordle/src/words.ts` con su ortografía correcta (con tilde si corresponde, ej: `ÁRBOL`, `CASA`, `TELÉFONO`, `PASIÓN`).
  * En **Modo Tildes**, la palabra se elegirá únicamente de las palabras con tilde.
  * En **Modo Normal**, se elegirá de cualquier palabra, normalizando su ortografía para jugar (ej: `ÁRBOL` -> `ARBOL`).

### Determinismo de la Semilla (PRNG)
* Utilizaremos el generador `mulberry32` inicializado con la semilla para asegurar que el orden de las palabras en el Modo Contrarreloj y la palabra del Modo Normal sean idénticos para la misma semilla.

---

## 3. Lógica de Comparación de Palabras (Algoritmo de Coloreado)

Sea la palabra secreta $S$ de longitud $M$ y la conjetura $G$ de longitud $N$.
1. **Pista de Inicio**: Si $G[0] == S[0]$, el primer elemento de la fila de conjetura se marca como verde y se le asigna la propiedad de borde redondeado izquierdo (`is-initial`).
2. **Pista de Fin**: Si $G[N-1] == S[M-1]$, el último elemento de la fila se marca como verde y se le asigna la propiedad de borde redondeado derecho (`is-final`).
3. **Pistas de Posición (Verde)**: Para cada índice $i$ donde $i < N$ e $i < M$:
   * Si no se ha emparejado por las reglas 1 o 2, y $G[i] == S[i]$, se marca como verde.
4. **Pistas de Letra (Amarillo)**:
   * Creamos una lista de letras de $S$ no emparejadas como verdes.
   * Para cada letra $G[j]$ que no sea verde: si existe en la lista de letras restantes de $S$, se marca como amarilla y se elimina esa letra de la lista. En caso contrario, se marca como gris.

---

## 4. Diseño de la Interfaz de Usuario (HTML/CSS)

### Menú de Inicio
* Selectores de configuración:
  * Checkbox para **Modo Tildes**.
  * Checkbox para **Modo Difícil (Longitud Oculta)**.
  * Checkbox para **Modo Contrarreloj**.
  * Input de texto para **Semilla personalizada**.
  * Botón para "Empezar Partida".

### Zona de Juego
* **Contenedor del Tablero**: Elemento flex vertical con scrollbar oculto:
  ```css
  .attempts-container {
    flex-grow: 1;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .attempts-container::-webkit-scrollbar {
    display: none;
  }
  ```
* En móviles, al tocar cualquier punto del tablero, realizaremos `.focus()` sobre un input oculto:
  ```html
  <input type="text" id="hiddenInput" style="position: absolute; opacity: 0; pointer-events: none;" autocomplete="off" autocapitalize="characters">
  ```
* **Fila Activa**: A medida que el usuario escribe en el input oculto o físico, actualizaremos dinámicamente las letras de la fila en curso.

---

## 5. Control de Tiempos y Penalización de Salto

* **Modo Normal**: Un cronómetro en formato `MM:SS` que incrementa cada segundo.
* **Modo Contrarreloj**: Un temporizador descendente que inicia en `05:00`.
  * Cuenta con un botón "Saltar Palabra".
  * Al saltar, si el tiempo dedicado a la palabra actual $T$ es menor de 30 segundos, se restan $30 - T$ segundos del temporizador global. Si es 30 o mayor, se salta sin coste de tiempo.
  * Al agotarse el tiempo, finaliza la partida mostrando los aciertos.
