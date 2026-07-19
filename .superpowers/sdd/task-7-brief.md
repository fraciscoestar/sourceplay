### Task 7: Game Lifecycle, Time Trial, and Stopwatch Timer

**Files:**
- Modify: `packages/wordle/src/main.ts`

**Interfaces:**
- Consumes: Game configuration settings.
- Produces: Countdown timers, Stopwatch counters, skip actions, and game init.

- [x] **Step 1: Implement full setupGame and loadNextWord logic in main.ts**
  Replace stubs and complete game setup:
  ```typescript
  function startGame(): void {
    // Read config
    tildesMode = menuTildesCheck.checked;
    hiddenLengthMode = menuHiddenLengthCheck.checked;
    timeTrialMode = menuTimeTrialCheck.checked;
    
    const rawSeed = menuSeedInput.value.trim() || String(randomSeed());
    seedNum = parseSeed(rawSeed);
    prng = mulberry32(seedNum);
    
    guesses = [];
    currentGuess = '';
    isGameOver = false;
    score = 0;
    elapsedTime = 0;
    timeTrialRemaining = 300;
    
    // UI setup
    seedLabel.textContent = '#' + rawSeed;
    scoreCount.textContent = '0';
    if (timeTrialMode) {
      scoreLabel.classList.remove('hidden');
      skipWordBtn.classList.remove('hidden');
      revealWordBtn.classList.add('hidden');
    } else {
      scoreLabel.classList.add('hidden');
      skipWordBtn.classList.add('hidden');
      revealWordBtn.classList.remove('hidden');
    }
    
    // Render tags
    gameModeTags.innerHTML = '';
    if (tildesMode) gameModeTags.innerHTML += '<span class="tag">Tildes</span>';
    if (hiddenLengthMode) gameModeTags.innerHTML += '<span class="tag">Oculto</span>';
    if (timeTrialMode) gameModeTags.innerHTML += '<span class="tag">Contrarreloj</span>';
    if (!tildesMode && !hiddenLengthMode && !timeTrialMode) gameModeTags.innerHTML += '<span class="tag">Normal</span>';

    // Transition views
    startMenu.classList.add('hidden');
    gameArea.classList.remove('hidden');
    endGameOverlay.classList.remove('show');
    
    // Load first word
    loadNextWord();
    
    // Start timers
    startTimer();
    
    // Set focus
    setTimeout(() => hiddenInput.focus(), 50);
  }

  function loadNextWord(): void {
    secretWord = getSeededWord(prng, tildesMode);
    guesses = [];
    currentGuess = '';
    isGameOver = false;
    wordStartTime = Date.now(); // track start time of this word
    renderBoard();
  }

  function startTimer(): void {
    stopTimer();
    startTime = Date.now();
    timerId = window.setInterval(() => {
      if (timeTrialMode) {
        timeTrialRemaining--;
        if (timeTrialRemaining <= 0) {
          timeTrialRemaining = 0;
          handleTimeTrialEnd();
        }
        timerEl.textContent = formatTime(timeTrialRemaining);
      } else {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = formatTime(elapsedTime);
      }
    }, 1000);
    timerEl.textContent = formatTime(timeTrialMode ? timeTrialRemaining : elapsedTime);
  }

  function stopTimer(): void {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Skip Penalty Mechanics
  function handleSkipWord(): void {
    if (isGameOver) return;
    const elapsedOnWord = Math.floor((Date.now() - wordStartTime) / 1000);
    if (elapsedOnWord < 30) {
      const penalty = 30 - elapsedOnWord;
      timeTrialRemaining = Math.max(0, timeTrialRemaining - penalty);
      showToast(`¡Saltado! Penalización de -${penalty}s`);
    } else {
      showToast('¡Saltado!');
    }
    loadNextWord();
  }

  function handleRevealWord(): void {
    if (isGameOver) return;
    isGameOver = true;
    stopTimer();
    modalTitle.textContent = 'Partida Terminada';
    modalDesc.textContent = `La palabra secreta era "${secretWord}".`;
    modalNextBtn.classList.add('hidden');
    modalReplayBtn.classList.remove('hidden');
    endGameOverlay.classList.add('show');
  }

  function handleTimeTrialEnd(): void {
    isGameOver = true;
    stopTimer();
    modalTitle.textContent = '¡Tiempo Agotado!';
    modalDesc.textContent = `Adivinaste un total de ${score} palabras usando la semilla #${seedLabel.textContent?.slice(1)}.`;
    modalNextBtn.classList.add('hidden');
    modalReplayBtn.classList.remove('hidden');
    endGameOverlay.classList.add('show');
  }

  // Setup main view buttons
  startGameBtn.addEventListener('click', startGame);
  skipWordBtn.addEventListener('click', handleSkipWord);
  revealWordBtn.addEventListener('click', handleRevealWord);
  restartGameBtn.addEventListener('click', startGame);
  
  exitToMenuBtn.addEventListener('click', () => {
    stopTimer();
    gameArea.classList.add('hidden');
    startMenu.classList.remove('hidden');
  });

  modalHomeBtn.addEventListener('click', () => {
    endGameOverlay.classList.remove('show');
    gameArea.classList.add('hidden');
    startMenu.classList.remove('hidden');
  });

  modalReplayBtn.addEventListener('click', () => {
    endGameOverlay.classList.remove('show');
    startGame();
  });
  ```

- [x] **Step 2: Verify TypeScript compilation**
  Run: `npx tsc --noEmit --workspace=@sourceplay/wordle`
  Expected: Command runs successfully.

- [x] **Step 3: Commit timers and options logic**
  Run:
  ```bash
  git add packages/wordle/src/main.ts
  git commit -m "feat(wordle): implement Game loop, Contrarreloj mode, timers and skip penalties"
  ```

---

