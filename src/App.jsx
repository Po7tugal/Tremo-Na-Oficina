/**
 * App.jsx — Root Application Component
 * ---------------------------------------
 * Composes all major sections:
 *   - Header (title, controls)
 *   - WebcamView (camera + gesture recognition)
 *   - GameBoard (word grid)
 *   - SignReference (alphabet chart)
 *
 * Also handles:
 *   - Global keyboard event listener
 *   - High contrast mode toggle
 *   - Routing letter inputs from both webcam and keyboard
 *
 * Dependencies: React, all child components, useGameLogic hook
 * Used by: main.jsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.jsx';
import { WebcamView } from './components/WebcamView.jsx';
import { GameBoard } from './components/GameBoard.jsx';
import { SignReference } from './components/SignReference.jsx';
import { useGameLogic } from './hooks/useGameLogic.js';
import { GAME_STATE } from './utils/gameLogic.js';

export default function App() {
  const {
    board,
    currentRow,
    gameState,
    keyboardMap,
    message,
    isShaking,
    addLetter,
    deleteLetter,
    submitGuess,
    resetGame,
  } = useGameLogic();

  const [highContrast, setHighContrast] = useState(false);
  const [detectedLetter, setDetectedLetter] = useState(null);

  const isGameOver = gameState !== GAME_STATE.PLAYING;

  /**
   * Handle a confirmed letter from either webcam or keyboard.
   */
  const handleLetter = useCallback((letter) => {
    setDetectedLetter(letter);
    setTimeout(() => setDetectedLetter(null), 600);
    addLetter(letter.toUpperCase());
  }, [addLetter]);

  /**
   * Global keyboard listener.
   * Maps: A-Z → addLetter, Enter → submitGuess, Backspace → deleteLetter
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isGameOver) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toUpperCase();

      if (key === 'ENTER') {
        e.preventDefault();
        submitGuess();
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        deleteLetter();
      } else if (/^[A-Z]$/.test(key) && e.key.length === 1) {
        e.preventDefault();
        handleLetter(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, submitGuess, deleteLetter, handleLetter]);

  /**
   * Toggle high contrast mode — updates the data-theme attribute on <html>
   */
  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const next = !prev;
      document.documentElement.setAttribute('data-contrast', next ? 'high' : 'normal');
      return next;
    });
  }, []);

  /**
   * Game over overlay state
   */
  const renderGameOverBanner = () => {
    if (!isGameOver) return null;
    return (
      <div
        className={`game-over-banner game-over-banner--${gameState}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="game-over-icon" aria-hidden="true">
          {gameState === GAME_STATE.WON ? '🎉' : '😔'}
        </span>
        <span>
          {gameState === GAME_STATE.WON
            ? 'Congratulations! You won!'
            : `Game over! Better luck next time.`}
        </span>
        <button
          className="btn btn-primary"
          onClick={resetGame}
          aria-label="Start a new game"
          autoFocus
        >
          Play Again
        </button>
      </div>
    );
  };

  return (
    <div
      className={`app ${highContrast ? 'app--high-contrast' : ''}`}
      data-contrast={highContrast ? 'high' : 'normal'}
    >
      {/* Skip to content link for screen reader / keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to game
      </a>

      <Header
        highContrast={highContrast}
        toggleHighContrast={toggleHighContrast}
        onNewGame={resetGame}
        gameState={gameState}
      />

      <main id="main-content" className="app-main">
        {/* Game over banner */}
        {renderGameOverBanner()}

        <div className="layout-grid">
          {/* Left column: Webcam */}
          <div className="col-webcam">
            <WebcamView
              onLetter={handleLetter}
              disabled={isGameOver}
            />
          </div>

          {/* Center column: Game Board */}
          <div className="col-board">
            <GameBoard
              board={board}
              currentRow={currentRow}
              message={message}
              isShaking={isShaking}
              onSubmit={submitGuess}
              onDelete={deleteLetter}
            />
          </div>

          {/* Right column (full width on mobile): Sign Reference */}
          <div className="col-reference">
            <SignReference highlightedLetter={detectedLetter} />
          </div>
        </div>
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>
          Tremo — An accessible sign language word game.{' '}
          <span aria-hidden="true">🤟</span>
        </p>
      </footer>
    </div>
  );
}