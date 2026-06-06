/**
 * GameBoard.jsx — Word Guessing Grid
 * ------------------------------------
 * Renders the 6x5 tile grid with color-coded feedback.
 * Handles animations, accessibility labels, and message display.
 *
 * Dependencies: React, gameLogic constants
 * Used by: App.jsx
 */

import React from 'react';
import { TILE_STATUS, MAX_ATTEMPTS, WORD_LENGTH } from '../utils/gameLogic.js';

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
function TileRow({ tiles, rowIndex, currentRow, isShaking }) {
  const isCurrentRow = rowIndex === currentRow;
  return (
    <div
      className={`tile-row ${isCurrentRow ? 'tile-row--active' : ''}`}
      role="row"
      aria-label={`Attempt ${rowIndex + 1}`}
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
 * @param {string|null} props.message - Toast message
 * @param {boolean} props.isShaking - Shake animation trigger
 * @param {Function} props.onSubmit - Submit current guess
 * @param {Function} props.onDelete - Delete last letter
 */
export function GameBoard({ board, currentRow, message, isShaking, onSubmit, onDelete }) {
  return (
    <section className="board-section" aria-label="Word guessing board">
      <h2 className="section-title">
        <span className="section-icon" aria-hidden="true">🟩</span>
        Guess the Word
      </h2>

      {/* Toast message */}
      <div
        className={`message-toast ${message ? 'message-toast--visible' : ''}`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {message}
      </div>

      {/* The 6x5 grid */}
      <div
        className="board-grid"
        role="grid"
        aria-label="Word guessing grid, 6 rows of 5 letters"
        aria-rowcount={MAX_ATTEMPTS}
        aria-colcount={WORD_LENGTH}
      >
        {board.map((row, rowIndex) => (
          <TileRow
            key={rowIndex}
            tiles={row}
            rowIndex={rowIndex}
            currentRow={currentRow}
            isShaking={isShaking}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="board-actions" role="group" aria-label="Game actions">
        <button
          className="btn btn-danger"
          onClick={onDelete}
          aria-label="Delete last letter"
        >
          ⌫ Delete
        </button>
        <button
          className="btn btn-success"
          onClick={onSubmit}
          aria-label="Submit your guess"
        >
          Enter ↵
        </button>
      </div>
    </section>
  );
}