import React from 'react';

// ─── Alphabet data ────────────────────────────────────────────────────────────
// Each letter has a short visual hint describing the hand shape.
// ENTER and BACKSPACE are separate at the bottom.

const LETTERS = [
  { l: 'A', hint: 'Punho, polegar ao lado' },
  { l: 'B', hint: '4 dedos retos, polegar dobrado' },
  { l: 'C', hint: 'Mão em curva de C' },
  { l: 'D', hint: 'Indicador levantado, outros tocam polegar' },
  { l: 'E', hint: 'Dedos curvados, polegar por baixo' },
  { l: 'F', hint: 'Indicador+polegar em círculo, 3 dedos acima' },
  { l: 'G', hint: 'Indicador horizontal, polegar paralelo' },
  { l: 'H', hint: 'Indicador+médio horizontais' },
  { l: 'I', hint: 'Só o mindinho levantado' },
  { l: 'J', hint: 'Mindinho + polegar para fora' },
  { l: 'K', hint: 'V aberto, polegar entre os dedos' },
  { l: 'L', hint: 'Indicador cima, polegar fora (L)' },
  { l: 'M', hint: 'Polegar sob 3 dedos' },
  { l: 'N', hint: 'Polegar sob 2 dedos' },
  { l: 'O', hint: 'Dedos formam círculo com polegar' },
  { l: 'P', hint: 'Como K apontado para baixo' },
  { l: 'Q', hint: 'Indicador+polegar para baixo' },
  { l: 'R', hint: 'Indicador+médio cruzados' },
  { l: 'S', hint: 'Punho, polegar por cima' },
  { l: 'T', hint: 'Polegar entre indicador e médio' },
  { l: 'U', hint: 'Indicador+médio juntos, retos' },
  { l: 'V', hint: 'Indicador+médio abertos (V)' },
  { l: 'W', hint: '3 dedos estendidos' },
  { l: 'X', hint: 'Indicador em gancho' },
  { l: 'Y', hint: 'Polegar+mindinho estendidos' },
  { l: 'Z', hint: 'Indicador traça Z, polegar fora' },
];

const SPECIALS = [
  { l: 'ENTER',     icon: '🖐', label: 'ENTER',     hint: 'Mão aberta, todos os dedos + polegar' },
  { l: 'BACKSPACE', icon: '👎', label: '⌫ DEL',     hint: 'Polegar apontado para baixo' },
];

// ─── Single card ──────────────────────────────────────────────────────────────

function SignCard({ letter, hint, icon, label, highlighted, special }) {
  return (
    <div className={`sign-card${highlighted ? ' sign-card--highlighted' : ''}${special ? ' sign-card--special' : ''}`}>
      {icon
        ? <span className="sign-card-icon" aria-hidden="true">{icon}</span>
        : <span className="sign-card-letter" aria-label={`Letra ${letter}`}>{letter}</span>
      }
      <span className="sign-card-label">{label ?? letter}</span>
      <span className="sign-card-hint">{hint}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SignReference({ highlightedLetter }) {
  return (
    <section className="sign-reference" aria-label="Referência do alfabeto gestual">

      <div className="sign-grid">
        {LETTERS.map(({ l, hint }) => (
          <SignCard
            key={l}
            letter={l}
            hint={hint}
            highlighted={highlightedLetter === l}
          />
        ))}
      </div>

      <div className="sign-specials">
        {SPECIALS.map(({ l, icon, label, hint }) => (
          <SignCard
            key={l}
            letter={l}
            icon={icon}
            label={label}
            hint={hint}
            highlighted={highlightedLetter === l}
            special
          />
        ))}
      </div>

    </section>
  );
}