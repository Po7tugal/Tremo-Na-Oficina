import { useState, useCallback, useRef, useEffect } from 'react';
import {
    evaluateGuess,
    buildKeyboardMap,
    createEmptyBoard,
    TILE_STATUS,
    GAME_STATE,
    MAX_ATTEMPTS,
    WORD_LENGTH,
} from '../utils/gameLogic.js';
import { getRandomWord, isValidWord } from '../data/words.js';
import {
    announceRowResult,
    announceWin,
    announceLoss,
    announceInvalidWord,
    announceIncompleteWord,
    announceDelete,
    announceLetterDetected,
} from '../utils/tts.js';

export function useGameLogic() {
    const [secretWord, setSecretWord] = useState(() => getRandomWord());
    const [board, setBoard] = useState(createEmptyBoard);
    const [currentGuess, setCurrentGuess] = useState('');
    const [currentRow, setCurrentRow] = useState(0);
    const [gameState, setGameState] = useState(GAME_STATE.PLAYING);
    const [keyboardMap, setKeyboardMap] = useState({});
    const [message, setMessage] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [evaluatedRows, setEvaluatedRows] = useState([]);

    // 🔧 Use ref to track current guess without closure issues
    const currentGuessRef = useRef('');
    const currentRowRef = useRef(0);

    console.log('🎮 Game initialized. Secret word:', secretWord);
    console.log(`📍 Current Row: ${currentRow}, Game State: ${gameState}`);

    const showMessage = useCallback((text, duration = 2500) => {
        console.log('📢 Message:', text);
        setMessage(text);
        setTimeout(() => setMessage(null), duration);
    }, []);

    const triggerShake = useCallback(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
    }, []);

    const addLetter = useCallback((letter) => {
        if (gameState !== GAME_STATE.PLAYING) {
            console.log('⚠️ Game not in PLAYING state');
            return;
        }

        if (currentGuessRef.current.length >= WORD_LENGTH) {
            console.log('⚠️ Word is already full (5 letters)');
            return;
        }

        const newGuess = currentGuessRef.current + letter;
        currentGuessRef.current = newGuess;
        console.log(`✍️ Letter added: "${letter}" → Current guess: "${newGuess}"`);

        setCurrentGuess(newGuess);

        setBoard(board => {
            const updated = board.map(row => row.map(tile => ({ ...tile })));
            updated[currentRowRef.current][newGuess.length - 1] = {
                letter,
                status: TILE_STATUS.PENDING,
            };
            return updated;
        });

        announceLetterDetected(letter);
    }, [gameState]);

    const deleteLetter = useCallback(() => {
        if (gameState !== GAME_STATE.PLAYING) {
            console.log('⚠️ Game not in PLAYING state');
            return;
        }

        if (currentGuessRef.current.length === 0) {
            console.log('⚠️ No letters to delete');
            return;
        }

        const removed = currentGuessRef.current[currentGuessRef.current.length - 1];
        const newGuess = currentGuessRef.current.slice(0, -1);
        currentGuessRef.current = newGuess;

        console.log(`🗑️ Letter deleted: "${removed}" → Current guess: "${newGuess}"`);
        setCurrentGuess(newGuess);

        setBoard(prev => {
            const updated = prev.map(row => row.map(tile => ({ ...tile })));
            updated[currentRowRef.current][newGuess.length] = {
                letter: '',
                status: TILE_STATUS.EMPTY,
            };
            return updated;
        });

        announceDelete(removed);
    }, [gameState]);

    const submitGuess = useCallback(() => {
        // ✅ Use ref.current for accurate guess length
        const guessToSubmit = currentGuessRef.current.trim().toUpperCase();

        console.log('🚀 submitGuess called');
        console.log('Current state:', {
            gameState,
            currentGuess: guessToSubmit,
            currentGuessLength: guessToSubmit.length,
            currentRow: currentRowRef.current,
            secretWord,
        });

        // ✅ Check 1: Game state
        if (gameState !== GAME_STATE.PLAYING) {
            console.log('❌ Game not in PLAYING state. Current state:', gameState);
            showMessage('Game is not active');
            return;
        }

        // ✅ Check 2: Word length
        if (guessToSubmit.length < WORD_LENGTH) {
            console.log(`❌ Word incomplete: "${guessToSubmit}" has ${guessToSubmit.length} letters, needs ${WORD_LENGTH}`);
            showMessage('Not enough letters');
            announceIncompleteWord();
            triggerShake();
            return;
        }

        if (guessToSubmit.length > WORD_LENGTH) {
            console.log(`❌ Word too long: "${guessToSubmit}" has ${guessToSubmit.length} letters, needs ${WORD_LENGTH}`);
            showMessage('Too many letters');
            triggerShake();
            return;
        }

        // ✅ Check 3: Valid word
        console.log(`🔍 Validating word: "${guessToSubmit}"`);
        const isValid = isValidWord(guessToSubmit);
        console.log(`✓ Validation result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

        if (!isValid) {
            console.log(`❌ Word not in dictionary: "${guessToSubmit}"`);
            showMessage('Not in word list');
            announceInvalidWord();
            triggerShake();
            return;
        }

        // ✅ All checks passed - evaluate guess
        console.log(`✅ All checks passed! Evaluating guess: "${guessToSubmit}" vs "${secretWord}"`);

        const result = evaluateGuess(guessToSubmit, secretWord);
        const newEvaluatedRows = [...evaluatedRows, result];

        console.log('Evaluation result:', result);

        // ✅ Update board with evaluated row
        setBoard(prev => {
            const updated = prev.map(row => row.map(tile => ({ ...tile })));
            updated[currentRowRef.current] = result;
            return updated;
        });

        setEvaluatedRows(newEvaluatedRows);
        setKeyboardMap(buildKeyboardMap(newEvaluatedRows));
        announceRowResult(result);

        // ✅ Check if won
        const won = result.every(t => t.status === TILE_STATUS.CORRECT);

        if (won) {
            console.log('🎉 GAME WON!');
            setGameState(GAME_STATE.WON);
            const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
            showMessage(messages[currentRowRef.current] ?? 'You got it!', 4000);
            setTimeout(() => announceWin(currentRowRef.current + 1), 1000);
        } else {
            // ✅ Not won, check if can continue
            const nextRow = currentRowRef.current + 1;

            if (nextRow >= MAX_ATTEMPTS) {
                // ✅ Lost on last attempt
                console.log('💀 GAME LOST! Word was:', secretWord);
                setGameState(GAME_STATE.LOST);
                showMessage(`Game Over! Word was: ${secretWord}`, 6000);
                setTimeout(() => announceLoss(secretWord), 800);
            } else {
                // ✅ Continue to next row
                console.log(`➡️ Moving to next row: ${nextRow}`);
                currentRowRef.current = nextRow;
                setCurrentRow(nextRow);
            }
        }

        // ✅ Reset guess
        setCurrentGuess('');
        currentGuessRef.current = '';
    }, [gameState, secretWord, evaluatedRows, showMessage, triggerShake]);

    // ✅ Sync refs with state
    useEffect(() => {
        currentRowRef.current = currentRow;
    }, [currentRow]);

    const resetGame = useCallback(() => {
        console.log('🔄 Game reset');
        const newWord = getRandomWord();
        console.log('New secret word:', newWord);
        setSecretWord(newWord);
        setBoard(createEmptyBoard());
        setCurrentGuess('');
        currentGuessRef.current = '';
        currentRowRef.current = 0;
        setCurrentRow(0);
        setGameState(GAME_STATE.PLAYING);
        setKeyboardMap({});
        setMessage(null);
        setIsShaking(false);
        setEvaluatedRows([]);
    }, []);

    return {
        board,
        currentGuess,
        currentRow,
        gameState,
        secretWord,
        keyboardMap,
        message,
        isShaking,
        addLetter,
        deleteLetter,
        submitGuess,
        resetGame,
    };
}