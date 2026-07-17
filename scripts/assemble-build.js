const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const selectorDist = path.join(__dirname, '../apps/selector/dist');
const sudokuDist = path.join(__dirname, '../packages/sudoku/dist');
const targetSudokuPath = path.join(selectorDist, 'games/sudoku');
const nonogramDist = path.join(__dirname, '../packages/nonogram/dist');
const targetNonogramPath = path.join(selectorDist, 'games/nonogram');
const wordsearchDist = path.join(__dirname, '../packages/wordsearch/dist');
const targetWordsearchPath = path.join(selectorDist, 'games/wordsearch');

console.log('Ensamblando despliegue final de SourcePlay...');

if (!fs.existsSync(selectorDist)) {
  console.error('Error: Compilación de selector no encontrada. Ejecuta build primero.');
  process.exit(1);
}

if (fs.existsSync(sudokuDist)) {
  console.log(`Copiando build de Sudoku de ${sudokuDist} a ${targetSudokuPath}...`);
  copyDirSync(sudokuDist, targetSudokuPath);
  console.log('¡Sudoku copiado con éxito!');
} else {
  console.warn('Advertencia: Compilación de Sudoku no encontrada.');
}

if (fs.existsSync(nonogramDist)) {
  console.log(`Copiando build de Nonograma de ${nonogramDist} a ${targetNonogramPath}...`);
  copyDirSync(nonogramDist, targetNonogramPath);
  console.log('¡Nonograma copiado con éxito!');
} else {
  console.warn('Advertencia: Compilación de Nonograma no encontrada.');
}

if (fs.existsSync(wordsearchDist)) {
  console.log(`Copiando build de Sopa de letras de ${wordsearchDist} a ${targetWordsearchPath}...`);
  copyDirSync(wordsearchDist, targetWordsearchPath);
  console.log('¡Sopa de letras copiada con éxito!');
} else {
  console.warn('Advertencia: Compilación de Sopa de letras no encontrada.');
}

console.log('Ensamblado completado con éxito.');
