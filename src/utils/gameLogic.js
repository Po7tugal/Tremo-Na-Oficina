/**
 * gameLogic.js — Core Game Logic Utilities
 * ------------------------------------------
 * Pure functions that compute game state from inputs.
 * No side effects, no DOM access — fully testable.
 *
 * Dependencies: none
 * Used by: useGameLogic hook
 */

export const TILE_STATUS = {
  EMPTY: 'empty',      // Not yet filled
  PENDING: 'pending',  // Filled but not yet evaluated
  CORRECT: 'correct',  // Green: right letter, right position
  PRESENT: 'present',  // Yellow: right letter, wrong position
  ABSENT: 'absent',    // Gray: letter not in word
};

export const GAME_STATE = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

export const MAX_ATTEMPTS = 6;
export const WORD_LENGTH = 5;

/**
 * Evaluate a guess against the secret word.
 * Implements the standard Wordle scoring algorithm:
 * - First pass marks exact matches (green)
 * - Second pass marks present-but-wrong-position (yellow), accounting for
 *   already-matched letters to avoid double-counting.
 *
 * @param {string} guess - The 5-letter guess (uppercase)
 * @param {string} secret - The 5-letter secret word (uppercase)
 * @returns {Array<{letter: string, status: string}>}
 */
export function evaluateGuess(guess, secret) {
  const result = Array(WORD_LENGTH).fill(null).map((_, i) => ({
    letter: guess[i],
    status: TILE_STATUS.ABSENT,
  }));

  // Track remaining letters in secret (for yellow logic)
  const secretLetterPool = {};
  for (let i = 0; i < WORD_LENGTH; i++) {
    // Only add to pool if not an exact match
    if (guess[i] !== secret[i]) {
      secretLetterPool[secret[i]] = (secretLetterPool[secret[i]] || 0) + 1;
    }
  }

  // First pass: mark greens
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === secret[i]) {
      result[i].status = TILE_STATUS.CORRECT;
    }
  }

  // Second pass: mark yellows
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i].status === TILE_STATUS.CORRECT) continue;
    const letter = guess[i];
    if (secretLetterPool[letter] > 0) {
      result[i].status = TILE_STATUS.PRESENT;
      secretLetterPool[letter]--;
    }
  }

  return result;
}

/**
 * Build the keyboard letter status map from all previous guesses.
 * Each key holds the "best" status that letter has achieved.
 *
 * Priority: correct > present > absent > undefined
 *
 * @param {Array<Array<{letter, status}>>} evaluatedRows
 * @returns {Object} Map of letter → best status
 */
export function buildKeyboardMap(evaluatedRows) {
  const priority = {
    [TILE_STATUS.CORRECT]: 3,
    [TILE_STATUS.PRESENT]: 2,
    [TILE_STATUS.ABSENT]: 1,
  };

  const map = {};
  for (const row of evaluatedRows) {
    for (const { letter, status } of row) {
      const existing = map[letter];
      if (!existing || priority[status] > priority[existing]) {
        map[letter] = status;
      }
    }
  }
  return map;
}

/**
 * Create a fresh empty board.
 * @returns {Array<Array<{letter: string, status: string}>>}
 */
export function createEmptyBoard() {
  return Array(MAX_ATTEMPTS).fill(null).map(() =>
    Array(WORD_LENGTH).fill(null).map(() => ({
      letter: '',
      status: TILE_STATUS.EMPTY,
    }))
  );
}