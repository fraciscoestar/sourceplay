### Task 6: Grid Rendering & Accent/Letroso Comparison Algorithm

**Files:**
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: Typing inputs, comparison properties.
- Produces: Visual grid of guesses, Letroso borders, and color coding.

- [ ] **Step 1: Replace stub rendering and add full comparison logic in main.ts**
  Modify `packages/wordle/src/main.ts` to implement full row creation, coloring, and rounded borders:
  ```typescript
  // Replace the stubs in main.ts:
  function renderBoard(): void {
    board.innerHTML = '';
    
    // 1. Render historical guesses
    guesses.forEach((guess) => {
      const row = document.createElement('div');
      row.className = 'row-guess';
      const colors = evaluateGuessColors(guess);
      
      for (let i = 0; i < guess.length; i++) {
        const tile = document.createElement('div');
        tile.className = `tile ${colors[i]}`;
        tile.textContent = guess[i];
        
        // Letroso boundary indicators
        if (hiddenLengthMode) {
          if (i === 0 && guess[0] === secretWord[0]) {
            tile.classList.add('is-initial');
          }
          if (i === guess.length - 1 && guess[guess.length - 1] === secretWord[secretWord.length - 1]) {
            tile.classList.add('is-final');
          }
        }
        row.appendChild(tile);
      }
      board.appendChild(row);
    });

    // 2. Render current active guess row
    if (!isGameOver) {
      const activeRow = document.createElement('div');
      activeRow.className = 'row-guess';
      
      const lengthToDraw = hiddenLengthMode ? Math.max(4, currentGuess.length) : secretWord.length;
      for (let i = 0; i < lengthToDraw; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (i < currentGuess.length) {
          tile.textContent = currentGuess[i];
          tile.classList.add('pop'); // Trigger CSS scaling
        } else {
          tile.textContent = '';
        }
        activeRow.appendChild(tile);
      }
      board.appendChild(activeRow);
    }
    
    // Auto-scroll to bottom of container
    attemptsContainer.scrollTop = attemptsContainer.scrollHeight;
    wordStatusLabel.textContent = `Intentos: ${guesses.length}`;
  }

  // Exact Coloring Evaluation Algorithm
  function evaluateGuessColors(guess: string): string[] {
    const n = guess.length;
    const m = secretWord.length;
    const colors = new Array<string>(n).fill('absent');
    
    let isInitialMatched = false;
    let isFinalMatched = false;

    // First letter boundary match (Letroso style)
    if (hiddenLengthMode && guess[0] === secretWord[0]) {
      colors[0] = 'correct';
      isInitialMatched = true;
    }
    // Last letter boundary match (Letroso style)
    if (hiddenLengthMode && guess[n - 1] === secretWord[m - 1]) {
      colors[n - 1] = 'correct';
      isFinalMatched = true;
    }

    // Standard position matches (Greens)
    for (let i = 0; i < Math.min(n, m); i++) {
      if (i === 0 && isInitialMatched) continue;
      if (i === n - 1 && isFinalMatched) continue;
      if (guess[i] === secretWord[i]) {
        colors[i] = 'correct';
      }
    }

    // Remaining pool of characters in secret word
    const pool: string[] = [];
    for (let i = 0; i < m; i++) {
      let isMatchedGreen = false;
      if (i === 0 && isInitialMatched) isMatchedGreen = true;
      if (i === m - 1 && isFinalMatched) isMatchedGreen = true;
      if (!isMatchedGreen && i < n && guess[i] === secretWord[i]) isMatchedGreen = true;
      
      if (!isMatchedGreen) {
        pool.push(secretWord[i]);
      }
    }

    // Character existence matches (Yellows)
    for (let i = 0; i < n; i++) {
      if (colors[i] === 'correct') continue;
      const char = guess[i];
      const poolIdx = pool.indexOf(char);
      if (poolIdx !== -1) {
        colors[i] = 'present';
        pool.splice(poolIdx, 1);
      }
    }

    return colors;
  }
  ```

- [ ] **Step 2: Implement submitGuess validation**
  ```typescript
  function submitGuess(): void {
    if (isGameOver) return;
    
    const minLen = hiddenLengthMode ? 4 : secretWord.length;
    if (currentGuess.length < minLen) {
      showToast(`La palabra debe tener al menos ${minLen} letras`);
      return;
    }
    
    if (!isValidWord(currentGuess)) {
      showToast('No está en el diccionario');
      return;
    }
    
    // Add guess and reset input
    guesses.push(currentGuess);
    const lastGuess = currentGuess;
    currentGuess = '';
    
    renderBoard();

    // Check Win
    if (lastGuess === secretWord) {
      handleWin();
    }
  }

  function handleWin(): void {
    isGameOver = true;
    if (timeTrialMode) {
      score++;
      scoreCount.textContent = String(score);
      showToast('¡Correcto! Siguiente palabra...');
      setTimeout(() => {
        loadNextWord();
      }, 1000);
    } else {
      stopTimer();
      modalTitle.textContent = '¡Victoria!';
      modalDesc.textContent = `Adivinaste la palabra secreta "${secretWord}" en ${guesses.length} intentos y ${formatTime(elapsedTime)}.`;
      modalNextBtn.classList.add('hidden');
      modalReplayBtn.classList.remove('hidden');
      endGameOverlay.classList.add('show');
    }
  }
  ```

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit --workspace=@sourceplay/wordle`
  Expected: Command runs successfully.

- [ ] **Step 4: Commit rendering algorithm**
  Run:
  ```bash
  git add packages/wordle/src/main.ts
  git commit -m "feat(wordle): implement Letroso rounded border rendering and guess coloring"
  ```

---

