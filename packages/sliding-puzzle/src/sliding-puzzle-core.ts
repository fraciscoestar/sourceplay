export type DifficultyKey = 'facil' | 'medio' | 'dificil' | 'experto';

export interface BoardSize {
  label: string;
  cols: number;
  rows: number;
  shuffleMoves: number;
}

export const SIZES: Record<DifficultyKey, BoardSize> = {
  facil: {
    label: 'Fácil (3×3)',
    cols: 3,
    rows: 3,
    shuffleMoves: 100
  },
  medio: {
    label: 'Medio (4×4)',
    cols: 4,
    rows: 4,
    shuffleMoves: 300
  },
  dificil: {
    label: 'Difícil (6×5)',
    cols: 6,
    rows: 5,
    shuffleMoves: 800
  },
  experto: {
    label: 'Experto (7×7)',
    cols: 7,
    rows: 7,
    shuffleMoves: 1500
  }
};

/**
 * Generates a deterministically shuffled sliding puzzle board.
 * Starts from the solved state and performs reverse random moves.
 * This guarantees the board is 100% solvable.
 */
export function generatePuzzle(
  rows: number,
  cols: number,
  shuffleMoves: number,
  rng: () => number
): { board: number[]; emptyIndex: number } {
  const size = rows * cols;
  const board = Array.from({ length: size }, (_, i) => (i === size - 1 ? 0 : i + 1));
  let emptyIndex = size - 1;

  let lastIndex = -1;

  for (let move = 0; move < shuffleMoves; move++) {
    const validMoves = getMovableTiles(emptyIndex, rows, cols);
    // Filter out the lastIndex to prevent immediately undoing the previous move
    let choices = validMoves.filter(idx => idx !== lastIndex);
    if (choices.length === 0) {
      choices = validMoves;
    }

    // Pick one choice deterministically using rng
    const choiceIdx = Math.floor(rng() * choices.length);
    const chosenTileIndex = choices[choiceIdx];

    // Swap empty tile (0) with the chosen tile
    board[emptyIndex] = board[chosenTileIndex];
    board[chosenTileIndex] = 0;

    lastIndex = emptyIndex;
    emptyIndex = chosenTileIndex;
  }

  return { board, emptyIndex };
}

/**
 * Returns the 1D index positions of tiles adjacent to the empty space (0)
 * that can be slid into the empty space.
 */
export function getMovableTiles(emptyIndex: number, rows: number, cols: number): number[] {
  const moves: number[] = [];
  const r = Math.floor(emptyIndex / cols);
  const c = emptyIndex % cols;

  // Up neighbor (slides down into empty space)
  if (r > 0) moves.push((r - 1) * cols + c);
  // Down neighbor (slides up into empty space)
  if (r < rows - 1) moves.push((r + 1) * cols + c);
  // Left neighbor (slides right into empty space)
  if (c > 0) moves.push(r * cols + (c - 1));
  // Right neighbor (slides left into empty space)
  if (c < cols - 1) moves.push(r * cols + (c + 1));

  return moves;
}

/**
 * Checks if the board is in its solved configuration.
 * The solved board has tiles 1 to (size-1) in order, and the empty space (0) at the end.
 */
export function isSolved(board: number[]): boolean {
  const size = board.length;
  for (let i = 0; i < size - 1; i++) {
    if (board[i] !== i + 1) {
      return false;
    }
  }
  return board[size - 1] === 0;
}
