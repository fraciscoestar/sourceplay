# Task 7 Report: Game Lifecycle, Time Trial, and Stopwatch Timer

## What Was Implemented

1. **Full Game Lifecycle (`startGame` and `loadNextWord`):**
   - Configured options (`tildesMode`, `hiddenLengthMode`, and `timeTrialMode`) by reading menu inputs.
   - Initialized PRNG with Mulberry32 using parsed or random seed.
   - Cleared and initialized game states (`guesses`, `currentGuess`, `isGameOver`, `score`, `elapsedTime`, `timeTrialRemaining`).
   - Standardized UI and styling toggles based on modes (score and skip tags, seed numbers, tags for modes, layouts transitions, views swapping).
   - Placed focus on the typing input field with `hiddenInput.focus()`.
   - Fetched Spanish Wordle words dynamically using seeded indices with `getSeededWord()`.

2. **Game Timers & Stopwatch Control (`startTimer`, `stopTimer`, `formatTime`):**
   - Created full countdown/stopwatch logic updating every 1000ms.
   - Added support for standard Stopwatch (`elapsedTime`) and Contrarreloj (5 minutes countdown) modes.
   - Triggered Game Over modal overlay automatically on time trial expiration (`handleTimeTrialEnd`).

3. **Skip Word with penalty calculations (`handleSkipWord`):**
   - Implemented up-to-30s rules: when skip button is clicked, calculated elapsed time since word initialization.
   - Applied time trial time reductions (subtracting 30s minus time spent on word) if skip occurs within 30s, showing a toast with the penalty.
   - Showed a generic toast if skipped after 30s without time trial penalties.

4. **Win/Loss & Timeout Overlays (`handleRevealWord`, `handleTimeTrialEnd`, button event listeners):**
   - Hooked up endGameOverlay transitions, title, description, and button actions.
   - Registered all click listeners on interactive buttons (`startGameBtn`, `skipWordBtn`, `revealWordBtn`, `restartGameBtn`, `exitToMenuBtn`, `modalHomeBtn`, `modalReplayBtn`).
   - Cleaned up obsolete compiler stubs and unused variables wrapper.

## Reviewer Fixes Implemented

1. **Race Condition during Transition Delay:**
   - Introduced `transitionTimeoutId` to track the 1-second timeout between winning a word and loading the next in Time Trial mode.
   - Cleared the timeout inside `stopTimer()` (which is called during exit/game end).
   - Added a safety guard `if (isGameOver) return;` at the beginning of `loadNextWord()`.
   - Set `isGameOver` to `false` directly inside the timeout callback before calling `loadNextWord()` to allow normal transition under active play.

2. **Keyboard Events Captured Before Game Starts / Menu Active:**
   - Initialized `isGameOver = true;` to ignore keyboard events and hidden input entries upon initial page load.
   - Updated the `exitToMenuBtn` and `modalHomeBtn` event listeners to set `isGameOver = true` upon returning to the main menu.
   - This ensures that typing inputs, dictionary checks, and toast messages are completely silenced unless a game is actively in progress.

3. **Skip Penalty Display Sync:**
   - Modified `handleSkipWord()` to immediately update `timerEl.textContent` with the formatted remaining time upon a skip penalty, avoiding any visual delay.
   - Added check inside `handleSkipWord()` to end the game immediately using `handleTimeTrialEnd()` if a skip penalty reduces remaining time to 0 or less, returning without loading the next word.

## Files Changed

- **Modified:**
  - [packages/wordle/src/main.ts](file:///c:/Users/Fraci/Desktop/typescript%20projects/sourceplay/packages/wordle/src/main.ts)

## Verification Outputs

- Verified compilation clean and successful:
  - Run `npm run build` in `packages/wordle`: Clean compile and bundle (Vite).
  - Run `npm run build:all` at monorepo root: Clean compile and copy-assemble script ran without errors.

## Self-Review Findings

- **Completeness:** Fully implemented all lifecycle initializers, timers, skip word mechanics, overlays, and button event listeners requested.
- **Compilation:** TypeScript compiled cleanly without any warnings or type errors.
- **Aesthetic Consistency:** Correctly handles visibility and transition class changes (`hidden`, `show`) in synchronization with the game lifecycle.

## Issues/Concerns

- None.
