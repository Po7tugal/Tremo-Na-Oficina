import { useState, useCallback } from 'react';
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

    const showMessage = useCallback((text, duration = 2500) => {
        setMessage(text);
        setTimeout(() => setMessage(null), duration);
    }, []);

    const triggerShake = useCallback(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
    }, []);

    // ✅ CORRIGIDO: usa forma funcional para não congelar o closure
    const addLetter = useCallback((letter) => {
        if (gameState !== GAME_STATE.PLAYING) return;

        setCurrentGuess(prev => {
            if (prev.length >= WORD_LENGTH) return prev;
            const newGuess = prev + letter;

            setBoard(board => {
                const updated = board.map(row => row.map(tile => ({ ...tile })));
                updated[currentRow][newGuess.length - 1] = {
                    letter,
                    status: TILE_STATUS.PENDING,
                };
                return updated;
            });

            announceLetterDetected(letter);
            return newGuess;
        });
    }, [gameState, currentRow]); // ← sem currentGuess aqui

    const deleteLetter = useCallback(() => {
        if (gameState !== GAME_STATE.PLAYING) return;
        if (currentGuess.length === 0) return;

        const removed = currentGuess[currentGuess.length - 1];
        const newGuess = currentGuess.slice(0, -1);
        setCurrentGuess(newGuess);

        setBoard(prev => {
            const updated = prev.map(row => row.map(tile => ({ ...tile })));
            updated[currentRow][newGuess.length] = {
                letter: '',
                status: TILE_STATUS.EMPTY,
            };
            return updated;
        });

        announceDelete(removed);
    }, [gameState, currentGuess, currentRow]);

    const submitGuess = useCallback(() => {
        if (gameState !== GAME_STATE.PLAYING) return;

        if (currentGuess.length < WORD_LENGTH) {
            showMessage('Not enough letters');
            announceIncompleteWord();
            triggerShake();
            return;
        }

        if (!isValidWord(currentGuess)) {
            showMessage('Not in word list');
            announceInvalidWord();
            triggerShake();
            return;
        }

        const result = evaluateGuess(currentGuess, secretWord);
        const newEvaluatedRows = [...evaluatedRows, result];

        setBoard(prev => {
            const updated = prev.map(row => row.map(tile => ({ ...tile })));
            updated[currentRow] = result;
            return updated;
        });

        setEvaluatedRows(newEvaluatedRows);
        setKeyboardMap(buildKeyboardMap(newEvaluatedRows));
        announceRowResult(result);

        const won = result.every(t => t.status === TILE_STATUS.CORRECT);
        const nextRow = currentRow + 1;

        if (won) {
            setGameState(GAME_STATE.WON);
            const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
            showMessage(messages[currentRow] ?? 'You got it!', 4000);
            setTimeout(() => announceWin(nextRow), 1000);
        } else if (nextRow >= MAX_ATTEMPTS) {
            setGameState(GAME_STATE.LOST);
            showMessage(secretWord, 6000);
            setTimeout(() => announceLoss(secretWord), 800);
        }

        setCurrentRow(nextRow);
        setCurrentGuess('');
    }, [gameState, currentGuess, secretWord, currentRow, evaluatedRows, showMessage, triggerShake]);

    const resetGame = useCallback(() => {
        setSecretWord(getRandomWord());
        setBoard(createEmptyBoard());
        setCurrentGuess('');
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