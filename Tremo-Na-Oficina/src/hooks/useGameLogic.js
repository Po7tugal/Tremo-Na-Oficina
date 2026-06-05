/**
 * useGameLogic.js – Core Game State Hook
 *
 * Purpose: Manages all Wordle-style game state: guesses, feedback,
 *          win/loss detection, and keyboard input handling.
 * Dependencies: React, words.js, tts.js
 * Responsibilities:
 *   - Track the secret word, current row, and current input.
 *   - Score each submitted guess (correct / present / absent).
 *   - Expose handlers for letter input, backspace, and submit.
 *   - Emit TTS announcements for every meaningful game event.
 * Interactions: Consumed by App.jsx; passes state down to Board and Keyboard.
 */

import { useState, useCallback, useEffect } from 'react';
import { getDailyWord, isValidWord } from '../data/words.js';
import { announce, MESSAGES } from '../utils/tts.js';

export const TILE_STATE = {
  EMPTY: 'empty',
  FILLED: 'filled',
  CORRECT: 'correct',
  PRESENT: 'present',
  ABSENT: 'absent',
};

export const GAME_STATE = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

/**
 * Score a guess against the target word.
 * Returns an array of TILE_STATE values.
 * Handles duplicate letters correctly (Wordle rules).
 *
 * @param {string} guess  - uppercase 5-letter guess
 * @param {string} target - uppercase 5-letter target
 * @returns {string[]} array of TILE_STATE values
 */
function scoreGuess(guess, target) {
  const result = Array(WORD_LENGTH).fill(TILE_STATE.ABSENT);
  const targetArr = target.split('');
  const guessArr = guess.split('');

  // First pass: mark correct positions
  const remainingTarget = [...targetArr];
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = TILE_STATE.CORRECT;
      remainingTarget[i] = null; // consumed
    }
  }

  // Second pass: mark present (wrong position)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === TILE_STATE.CORRECT) continue;
    const idx = remainingTarget.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = TILE_STATE.PRESENT;
      remainingTarget[idx] = null;
    }
  }

  return result;
}

/**
 * Build an empty board: 6 rows × 5 tiles.
 * Each tile: { letter: '', state: TILE_STATE.EMPTY }
 */
function buildEmptyBoard() {
  return Array.from({ length: MAX_GUESSES }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({
      letter: '',
      state: TILE_STATE.EMPTY,
    }))
  );
}

export default function useGameLogic() {
  const [secretWord, setSecretWord] = useState(() => getDailyWord());
  const [board, setBoard] = useState(buildEmptyBoard);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameState, setGameState] = useState(GAME_STATE.PLAYING);
  const [letterStatuses, setLetterStatuses] = useState({}); // for keyboard colouring
  const [shakeRow, setShakeRow] = useState(null); // for invalid-word animation
  const [message, setMessage] = useState(''); // temporary status message

  // Show a temporary toast message
  const flashMessage = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2500);
  }, []);

  /**
   * Add a single letter to the current position.
   * @param {string} letter - single uppercase character
   */
  const addLetter = useCallback(
    (letter) => {
      if (gameState !== GAME_STATE.PLAYING) return;
      if (currentCol >= WORD_LENGTH) return;
      if (!/^[A-Z]$/.test(letter)) return;

      setBoard((prev) => {
        const next = prev.map((row) => row.map((tile) => ({ ...tile })));
        next[currentRow][currentCol] = { letter, state: TILE_STATE.FILLED };
        return next;
      });
      setCurrentCol((c) => c + 1);
    },
    [gameState, currentRow, currentCol]
  );

  /**
   * Remove the last letter from the current row.
   */
  const deleteLetter = useCallback(() => {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (currentCol === 0) return;

    setBoard((prev) => {
      const next = prev.map((row) => row.map((tile) => ({ ...tile })));
      next[currentRow][currentCol - 1] = { letter: '', state: TILE_STATE.EMPTY };
      return next;
    });
    setCurrentCol((c) => c - 1);
  }, [gameState, currentRow, currentCol]);

  /**
   * Submit the current row as a guess.
   */
  const submitGuess = useCallback(() => {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (currentCol < WORD_LENGTH) {
      flashMessage('Not enough letters');
      announce('Not enough letters. Keep going.');
      return;
    }

    const guess = board[currentRow].map((t) => t.letter).join('');

    if (!isValidWord(guess)) {
      flashMessage('Not in word list');
      announce(MESSAGES.invalidWord());
      // Shake animation
      setShakeRow(currentRow);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    const scores = scoreGuess(guess, secretWord);

    // Update board with scored tiles
    setBoard((prev) => {
      const next = prev.map((row) => row.map((tile) => ({ ...tile })));
      scores.forEach((state, i) => {
        next[currentRow][i] = { letter: guess[i], state };
      });
      return next;
    });

    // Update keyboard letter statuses (best state wins)
    const STATE_PRIORITY = {
      [TILE_STATE.CORRECT]: 3,
      [TILE_STATE.PRESENT]: 2,
      [TILE_STATE.ABSENT]: 1,
      [TILE_STATE.FILLED]: 0,
      [TILE_STATE.EMPTY]: 0,
    };
    setLetterStatuses((prev) => {
      const next = { ...prev };
      scores.forEach((state, i) => {
        const letter = guess[i];
        if ((STATE_PRIORITY[state] ?? 0) > (STATE_PRIORITY[prev[letter]] ?? 0)) {
          next[letter] = state;
        }
      });
      return next;
    });

    // Announce each letter's result
    setTimeout(() => {
      scores.forEach((state, i) => {
        const letter = guess[i];
        const delay = i * 400 + 300;
        setTimeout(() => {
          if (state === TILE_STATE.CORRECT) {
            announce(MESSAGES.correct(letter, i + 1), { interrupt: false });
          } else if (state === TILE_STATE.PRESENT) {
            announce(MESSAGES.present(letter), { interrupt: false });
          } else {
            announce(MESSAGES.absent(letter), { interrupt: false });
          }
        }, delay);
      });
    }, 100);

    const isWin = scores.every((s) => s === TILE_STATE.CORRECT);

    if (isWin) {
      const attempts = currentRow + 1;
      setTimeout(() => {
        setGameState(GAME_STATE.WON);
        announce(MESSAGES.win(secretWord, attempts));
        flashMessage(`🎉 Brilliant! You got it in ${attempts}!`);
      }, scores.length * 400 + 500);
    } else if (currentRow + 1 >= MAX_GUESSES) {
      setTimeout(() => {
        setGameState(GAME_STATE.LOST);
        announce(MESSAGES.lose(secretWord));
        flashMessage(`The word was ${secretWord}`);
      }, scores.length * 400 + 500);
    }

    setCurrentRow((r) => r + 1);
    setCurrentCol(0);
  }, [gameState, board, currentRow, currentCol, secretWord, flashMessage]);

  /**
   * Start a new game with a fresh random word.
   */
  const newGame = useCallback(() => {
    // Import getRandomWord dynamically to avoid circular deps at module level
    import('../data/words.js').then(({ getRandomWord }) => {
      const word = getRandomWord();
      setSecretWord(word);
      setBoard(buildEmptyBoard());
      setCurrentRow(0);
      setCurrentCol(0);
      setGameState(GAME_STATE.PLAYING);
      setLetterStatuses({});
      setShakeRow(null);
      setMessage('');
      announce(MESSAGES.newGame());
    });
  }, []);

  // ── Keyboard Handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        deleteLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLetter, deleteLetter, submitGuess]);

  return {
    secretWord,
    board,
    currentRow,
    currentCol,
    gameState,
    letterStatuses,
    shakeRow,
    message,
    addLetter,
    deleteLetter,
    submitGuess,
    newGame,
    maxGuesses: MAX_GUESSES,
    wordLength: WORD_LENGTH,
  };
}