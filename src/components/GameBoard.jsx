/**
 * GameBoard.jsx — Word Guessing Grid with Animations
 * ---------------------------------------------------
 * Renders the 6x5 tile grid with color-coded feedback and animations.
 * Handles animations for win/loss states.
 *
 * Dependencies: React, gameLogic constants
 * Used by: App.jsx
 */

import React from 'react';
import { TILE_STATUS, MAX_ATTEMPTS, WORD_LENGTH, GAME_STATE } from '../utils/gameLogic.js';

/**
 * Single tile in the grid.
 */
function Tile({ letter, status, isCurrentRow, colIndex, isShaking }) {
  const statusLabel = {
    [TILE_STATUS.CORRECT]: 'correct position',
    [TILE_STATUS.PRESENT]: 'present but wrong position',
    [TILE_STATUS.ABSENT]: 'not in word',
    [TILE_STATUS.PENDING]: '',
    [TILE_STATUS.EMPTY]: 'empty',
  }[status] || '';

  const ariaLabel = letter
    ? `${letter}${statusLabel ? `, ${statusLabel}` : ''}`
    : `Empty tile, position ${colIndex + 1}`;

  return (
    <div
      className={`tile tile--${status} ${isShaking && isCurrentRow ? 'tile--shake' : ''} ${letter && status === TILE_STATUS.PENDING ? 'tile--pop' : ''}`}
      aria-label={ariaLabel}
      role="gridcell"
      data-status={status}
    >
      {letter}
    </div>
  );
}

/**
 * One row of 5 tiles.
 */
function TileRow({ tiles, rowIndex, currentRow, isShaking, gameState }) {
  const isCurrentRow = rowIndex === currentRow;
  const isLastRow = rowIndex === MAX_ATTEMPTS - 1;
  const isLost = gameState === GAME_STATE.LOST && isLastRow;

  return (
    <div
      className={`tile-row ${isCurrentRow ? 'tile-row--active' : ''} ${isLost ? 'tile-row--lost' : ''}`}
      role="row"
      aria-label={`Attempt ${rowIndex + 1}`}
      data-is-current={isCurrentRow}
      data-is-lost={isLost}
    >
      {tiles.map((tile, colIndex) => (
        <Tile
          key={colIndex}
          letter={tile.letter}
          status={tile.status}
          isCurrentRow={isCurrentRow}
          colIndex={colIndex}
          isShaking={isShaking}
        />
      ))}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Array} props.board - 6x5 board state
 * @param {number} props.currentRow - Active row index
 * @param {string} props.gameState - Current game state (playing/won/lost)
 * @param {string|null} props.message - Toast message
 * @param {boolean} props.isShaking - Shake animation trigger
 * @param {Function} props.onSubmit - Submit current guess
 * @param {Function} props.onDelete - Delete last letter
 */
export function GameBoard({
  board,
  currentRow,
  gameState,
  message,
  isShaking,
  onSubmit,
  onDelete,
}) {
  const isGameOver = gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;
  const isWon = gameState === GAME_STATE.WON;
  const isLost = gameState === GAME_STATE.LOST;

  return (
    <section className="board-section" aria-label="Word guessing board">
      <h2 className="section-title">
        <span className="section-icon" aria-hidden="true">🟩</span>
        Adivinhe a Palavra
      </h2>

      {/* Toast message with game state styling */}
      <div
        className={`message-toast ${message ? 'message-toast--visible' : ''}`}
        data-type={isWon ? 'win' : isLost ? 'loss' : 'info'}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {message}
      </div>

      {/* The 6x5 grid with game state */}
      <div
        className="board-grid"
        role="grid"
        aria-label="Word guessing grid, 6 rows of 5 letters"
        aria-rowcount={MAX_ATTEMPTS}
        aria-colcount={WORD_LENGTH}
        data-game-state={gameState}
      >
        {board.map((row, rowIndex) => (
          <TileRow
            key={rowIndex}
            tiles={row}
            rowIndex={rowIndex}
            currentRow={currentRow}
            isShaking={isShaking}
            gameState={gameState}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="board-actions" role="group" aria-label="Game actions">
        <button
          className="btn btn-danger"
          onClick={onDelete}
          aria-label="Delete last letter"
          disabled={isGameOver}
        >
          ⌫ Delete
        </button>
        <button
          className="btn btn-success"
          onClick={onSubmit}
          aria-label="Submit your guess"
          disabled={isGameOver}
        >
          Enter ↵
        </button>
      </div>

      {/* Game over indicators */}
      {isGameOver && (
        <div
          className={`game-over-indicator ${isWon ? 'game-over-indicator--won' : 'game-over-indicator--lost'}`}
          role="status"
          aria-live="polite"
        >
          {isWon ? (
            <>
              <span className="game-over-emoji">🎉</span>
              <span className="game-over-text">Vitória!</span>
            </>
          ) : (
            <>
              <span className="game-over-emoji">💀</span>
              <span className="game-over-text">Game Over!</span>
            </>
          )}
        </div>
      )}
    </section>
  );
}