/**
 * SignReference.jsx
 * -----------------
 * Painel de referência do Alfabeto Manual LGP
 * (Língua Gestual Portuguesa — Associação Portuguesa de Surdos)
 *
 * Mostra a descrição de cada gesto ao utilizador durante o jogo.
 */

import React, { useState } from "react";

// Descrições dos gestos LGP baseadas no Alfabeto Manual (APS, 2009)
const LGP_GESTURES = {
  A: { desc: "Punho fechado, polegar ao lado dos dedos" },
  B: { desc: "Mão aberta reta, dedos esticados juntos" },
  C: { desc: "Mão em arco tipo meia-lua" },
  D: { desc: "Um dedo esticado, restantes dobrados" },
  E: { desc: "Todos os dedos dobrados, polegar recolhido" },
  F: { desc: "Indicador e médio esticados ou pinça leve com polegar" },
  G: { desc: "Indicador esticado lateralmente (forma de L deitada)" },
  H: { desc: "Indicador e médio esticados juntos" },
  I: { desc: "Apenas mindinho esticado" },
  J: { desc: "Mindinho esticado com movimento implícito" },
  K: { desc: "Mão totalmente aberta" },
  L: { desc: "Indicador para cima + polegar lateral (L)" },
  M: { desc: "Mão fechada com mindinho destacado" },
  N: { desc: "Dois dedos dobrados sobre o polegar" },
  O: { desc: "Dedos curvados formando círculo" },
  P: { desc: "Mão aberta com polegar destacado lateralmente" },
  Q: { desc: "Pinça apontada para baixo (polegar + indicador)" },
  R: { desc: "Indicador e médio juntos ou levemente cruzados" },
  S: { desc: "Punho fechado compacto" },
  T: { desc: "Polegar entre dedos dobrados" },
  U: { desc: "Indicador e médio juntos esticados" },
  V: { desc: "Indicador e médio separados (V)" },
  W: { desc: "Três dedos esticados separados" },
  X: { desc: "Indicador curvado em gancho" },
  Y: { desc: "Polegar e mindinho esticados" },
  Z: { desc: "Mindinho esticado isolado" },
};

const ALPHABET = Object.keys(LGP_GESTURES);

export default function SignReference({ activeLetters = [] }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="sign-reference">
      <h3 className="sign-reference__title">Alfabeto Manual LGP</h3>

      <div className="sign-reference__grid">
        {ALPHABET.map((letter) => {
          const isActive  = activeLetters.includes(letter);
          const isSelected = selected === letter;

          return (
            <button
              key={letter}
              className={[
                "sign-reference__key",
                isActive   ? "sign-reference__key--active"   : "",
                isSelected ? "sign-reference__key--selected" : "",
              ].join(" ").trim()}
              onClick={() => setSelected(isSelected ? null : letter)}
              title={LGP_GESTURES[letter].desc}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="sign-reference__tooltip">
          <span className="sign-reference__tooltip-letter">{selected}</span>
          <span className="sign-reference__tooltip-desc">
            {LGP_GESTURES[selected].desc}
          </span>
        </div>
      )}

      <p className="sign-reference__credit">
        Baseado no Alfabeto Manual da Associação Portuguesa de Surdos (APS, 2009)
      </p>
    </div>
  );
}

// Exporta também o dicionário de gestos, caso outros componentes precisem
export { LGP_GESTURES };