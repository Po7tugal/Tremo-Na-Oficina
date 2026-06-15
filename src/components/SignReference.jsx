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
  A: { desc: "Punho fechado, polegar repousa ao lado dos dedos" },
  B: { desc: "Punho fechado com polegar esticado para cima" },
  C: { desc: "Mão curvada em arco (forma de C), polegar afastado" },
  D: { desc: "Mão aberta com 4 dedos juntos e polegar dobrado para a palma" },
  E: { desc: "Apenas indicador esticado (apontar)" },
  F: { desc: "Indicador e polegar formam círculo (OK), outros 3 esticados" },
  G: { desc: "Indicador esticado para cima, polegar aberto para o lado (forma de L)" },
  H: { desc: "Indicador e médio esticados e juntos" },
  I: { desc: "Apenas mínimo esticado" },
  J: { desc: "Indicador e mínimo esticados (chifres), médio e anelar dobrados" },
  K: { desc: "Mão completamente aberta — todos os dedos e polegar esticados" },
  L: { desc: "Indicador para cima + polegar para o lado (forma de L)" },
  M: { desc: "Mínimo esticado, restantes dobrados com polegar tucked" },
  N: { desc: "Indicador e médio dobrados sobre o polegar, anelar e mínimo fechados" },
  O: { desc: "Todos os dedos curvados a tocar o polegar (forma de O)" },
  P: { desc: "Mão aberta, todos os dedos esticados e juntos, polegar afastado para cima" },
  Q: { desc: "Indicador dobrado a tocar o polegar, apontado para baixo" },
  R: { desc: "Indicador e médio cruzados e esticados (V cruzado)" },
  S: { desc: "Punho fechado, polegar por cima dos dedos" },
  T: { desc: "Polegar sai entre indicador e médio (todos dobrados)" },
  U: { desc: "Indicador e médio esticados e juntos, anelar e mínimo dobrados" },
  V: { desc: "Indicador e médio esticados e afastados (V da vitória)" },
  W: { desc: "Indicador, médio e anelar esticados e afastados" },
  X: { desc: "Indicador curvado em gancho, outros dedos fechados" },
  Y: { desc: "Polegar e mínimo esticados, outros dobrados (hang loose)" },
  Z: { desc: "Mínimo esticado com mão ligeiramente rodada" },
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