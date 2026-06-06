/**
 * Header.jsx — App Header
 * ------------------------
 * Displays the game title, controls for accessibility settings,
 * and the new game button.
 *
 * Dependencies: React
 * Used by: App.jsx
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} props.highContrast - High contrast mode state
 * @param {Function} props.toggleHighContrast - Toggle high contrast
 * @param {Function} props.onNewGame - Start a new game
 * @param {string} props.gameState - Current game state
 */
export function Header({ highContrast, toggleHighContrast, onNewGame, gameState }) {
  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div className="header-brand">
          <h1 className="app-title" aria-label="Tremo — Sign Language Word Game">
            <span className="title-sign" aria-hidden="true">🤟</span>
            Sign<span className="title-accent">Tremo</span>
          </h1>
          <p className="app-subtitle">Sign Language Wordle</p>
        </div>

        <nav className="header-controls" aria-label="Game controls">
          {/* High contrast toggle */}
          <button
            className={`btn btn-ghost icon-btn ${highContrast ? 'active' : ''}`}
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            aria-label={`High contrast mode: ${highContrast ? 'on' : 'off'}. Click to toggle.`}
            title="Toggle high contrast mode"
          >
            <span aria-hidden="true">
              {highContrast ? '☀️' : '🌙'}
            </span>
            <span className="btn-label">Contrast</span>
          </button>

          {/* New game button */}
          <button
            className="btn btn-primary"
            onClick={onNewGame}
            aria-label="Start a new game"
          >
            <span aria-hidden="true">↺</span> New Game
          </button>
        </nav>
      </div>

      {/* Keyboard shortcut guide */}
      <div className="keyboard-guide" role="note" aria-label="Keyboard shortcuts">
        <span>⌨️ Keyboard: <kbd>A</kbd>–<kbd>Z</kbd> to type · <kbd>Enter</kbd> to submit · <kbd>Backspace</kbd> to delete</span>
      </div>
    </header>
  );
}