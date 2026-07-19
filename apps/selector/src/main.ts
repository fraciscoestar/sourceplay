import { createHeader } from '@sourceplay/shared';

interface GameInfo {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}

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
  },
  {
    id: 'sliding-puzzle',
    title: 'Rompecabezas',
    description: 'Desliza las fichas numéricas al espacio vacío para ordenarlas. Cuatro dificultades.',
    url: import.meta.env.DEV ? 'http://localhost:5177/' : './games/sliding-puzzle/index.html',
    imageUrl: './assets/covers/sliding-puzzle.jpg'
  },
  {
    id: 'lights-out',
    title: 'Apaga las Luces',
    description: 'Conmuta las luces de la cuadrícula hasta apagarlas todas en el menor número de movimientos.',
    url: import.meta.env.DEV ? 'http://localhost:5178/' : './games/lights-out/index.html',
    imageUrl: './assets/covers/lights-out.jpg'
  },
  {
    id: 'wordle',
    title: 'Palabra del Día',
    description: 'Adivina la palabra secreta. Modos con tildes, longitud oculta y contrarreloj.',
    url: import.meta.env.DEV ? 'http://localhost:5179/' : './games/wordle/index.html',
    imageUrl: './assets/covers/wordle.jpg'
  }
];

function initSelector(): void {
  // Inyectar cabecera global compartida sin botón de retroceso
  createHeader({ showBackButton: false });

  const grid = document.getElementById('gamesGrid');
  if (!grid) return;

  GAMES_REGISTRY.forEach((game) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.addEventListener('click', () => {
      const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
      const url = new URL(game.url, window.location.href);
      url.searchParams.set('theme', currentTheme);
      window.location.href = url.toString();
    });

    card.innerHTML = `
      <div class="game-card-img-wrap">
        <img src="${game.imageUrl}" alt="${game.title}" class="game-card-img">
      </div>
      <div class="game-card-content">
        <h2 class="game-card-title">${game.title}</h2>
        <p class="game-card-desc">${game.description}</p>
        <span class="game-card-btn">Jugar</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', initSelector);
