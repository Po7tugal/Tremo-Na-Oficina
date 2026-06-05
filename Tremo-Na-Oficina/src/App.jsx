import React from 'react';
import useGameLogic from './hooks/useGameLogic'; // Importação corrigida!

function App() {
  // 1. Chame o hook para obter os estados e funções que já programou
  // (Substitua estes nomes pelos nomes exatos que usou no return do seu useGameLogic)
  const { currentGuess, guesses, submitGuess, currentRow } = useGameLogic();

  return (
    <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
      <h1>O Meu Jogo Inclusivo</h1>

      {/* 2. Exemplo visual: Mostrar a palavra que o utilizador está a digitar */}
      <div style={{ fontSize: '24px', margin: '20px 0', letterSpacing: '5px' }}>
        Tentativa Atual: {currentGuess || "_____"}
      </div>

      {/* 3. Exemplo de botão para submeter a palavra */}
      <button 
        onClick={submitGuess}
        style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '16px' }}
      >
        Enviar Palavra
      </button>

      {/* 4. Histórico de tentativas antigas */}
      <div style={{ marginTop: '20px' }}>
        <h3>Tentativas anteriores:</h3>
        {guesses.map((guess, index) => (
          <p key={index} style={{ opacity: 0.7 }}>{guess}</p>
        ))}
      </div>
    </div>
  );
}

export default App;