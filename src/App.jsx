import React, { useState, useCallback } from 'react';
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
   * Handle input from gestos — incluindo letras, ENTER e BACKSPACE.
   */
  const handleLetter = useCallback((letter) => {
    const upper = letter.toUpperCase();

    if (upper === 'ENTER') {
      submitGuess();
      return;
    }
    if (upper === 'BACKSPACE' || upper === 'DELETE') {
      deleteLetter();
      return;
    }

    setDetectedLetter(upper);
    setTimeout(() => setDetectedLetter(null), 600);
    addLetter(upper);
  }, [addLetter, deleteLetter, submitGuess]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const next = !prev;
      document.documentElement.setAttribute('data-contrast', next ? 'high' : 'normal');
      return next;
    });
  }, []);

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
            ? 'Parabéns! Ganhaste!'
            : 'Fim de jogo! Tenta outra vez.'}
        </span>
        <button
          className="btn btn-primary"
          onClick={resetGame}
          aria-label="Iniciar novo jogo"
          autoFocus
        >
          Jogar Novamente
        </button>
      </div>
    );
  };

  return (
    <div
      className={`app ${highContrast ? 'app--high-contrast' : ''}`}
      data-contrast={highContrast ? 'high' : 'normal'}
    >
      <a href="#main-content" className="skip-link">
        Ir para o jogo
      </a>

      <Header
        highContrast={highContrast}
        toggleHighContrast={toggleHighContrast}
        onNewGame={resetGame}
        gameState={gameState}
      />

      <main id="main-content" className="app-main">
        {renderGameOverBanner()}

        <div className="layout-grid">
          <div className="col-webcam">
            <WebcamView
              onLetter={handleLetter}
              disabled={isGameOver}
            />
          </div>

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

          <div className="col-reference">
            <SignReference highlightedLetter={detectedLetter} />
          </div>
        </div>
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>
          Tremo na Oficina — Jogo de palavras em língua gestual.{' '}
          <span aria-hidden="true">🤟</span>
        </p>
      </footer>
    </div>
  );
}