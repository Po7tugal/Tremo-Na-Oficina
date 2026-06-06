import React from 'react';

export function Header({ highContrast, toggleHighContrast, onNewGame, gameState }) {
  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div className="header-brand">
          <h1 className="app-title" aria-label="Tremo — Jogo de Língua Gestual">
            <span className="title-sign" aria-hidden="true">🤟</span>
            <span className="title-accent">Tremo</span>
          </h1>
        </div>

        <nav className="header-controls" aria-label="Controlos do jogo">
          <button
            className={`btn btn-ghost icon-btn ${highContrast ? 'active' : ''}`}
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            aria-label={`Contraste elevado: ${highContrast ? 'ativo' : 'inativo'}`}
            title="Alternar contraste elevado"
          >
            <span aria-hidden="true">{highContrast ? '☀️' : '🌙'}</span>
            <span className="btn-label">Contraste</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={onNewGame}
            aria-label="Iniciar novo jogo"
          >
            <span aria-hidden="true">↺</span> Novo Jogo
          </button>
        </nav>
      </div>
    </header>
  );
}