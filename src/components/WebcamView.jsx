import React from 'react';
import { useWebcam } from '../hooks/useWebcam.js';

export function WebcamView({ onLetter, disabled }) {
  const {
    videoRef,
    cameraState,
    errorMessage,
    detection,
    startCamera,
    stopCamera,
    simulateLetter,
  } = useWebcam(disabled ? () => {} : onLetter);

  const isActive = cameraState === 'active';
  const isRequesting = cameraState === 'requesting';

  return (
    <section className="webcam-section" aria-label="Câmara e reconhecimento de gestos">
      <h2 className="section-title">
        <span className="section-icon" aria-hidden="true">📷</span>
        Câmara
      </h2>

      {/* Vídeo */}
      <div className="video-wrapper" role="img" aria-label="Imagem da câmara">
        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          playsInline
          muted
        />

        {!isActive && (
          <div className="video-placeholder" aria-hidden="true">
            <div className="placeholder-icon">🖐</div>
            <p className="placeholder-text">
              {isRequesting ? 'A ligar câmara...' : 'Câmara desligada'}
            </p>
          </div>
        )}

        {/* Overlay de deteção */}
        {isActive && detection.letter && (
          <div className="detection-overlay" aria-live="polite">
            <div className="detected-letter" aria-hidden="true">
              {detection.letter}
            </div>
            <div
              className="hold-progress-bar"
              role="progressbar"
              aria-valuenow={Math.round(detection.holdProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="hold-progress-fill"
                style={{ width: `${detection.holdProgress * 100}%` }}
              />
            </div>
            <div className="confidence-label" aria-hidden="true">
              {Math.round(detection.confidence * 100)}% confiança
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="error-banner" role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Controlos da câmara */}
      <div className="camera-controls">
        {!isActive ? (
          <button
            className="btn btn-primary"
            onClick={startCamera}
            disabled={isRequesting || disabled}
          >
            {isRequesting ? '⏳ A ligar...' : '▶ Ligar Câmara'}
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={stopCamera}>
            ⏹ Desligar Câmara
          </button>
        )}
      </div>

      {/* Botões de gesto especial */}
      {!disabled && (
        <div className="gesture-actions" aria-label="Ações por gesto">
          <button
            className="btn btn-gesture btn-enter"
            onClick={() => simulateLetter('ENTER')}
            aria-label="Confirmar palavra (mão aberta)"
            title="Gesto: mão aberta"
          >
            ✋ Confirmar
          </button>
          <button
            className="btn btn-gesture btn-delete"
            onClick={() => simulateLetter('BACKSPACE')}
            aria-label="Apagar letra (polegar para baixo)"
            title="Gesto: polegar para baixo"
          >
            👎 Apagar
          </button>
        </div>
      )}

      {/* Teclado de teste */}
      {!disabled && (
        <div className="manual-input-section" aria-label="Letras para teste">
          <p className="manual-input-label">Teste manual:</p>
          <div className="mini-keyboard" role="group">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
              <button
                key={letter}
                className="mini-key"
                onClick={() => simulateLetter(letter)}
                aria-label={`Letra ${letter}`}
                disabled={disabled}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mock-notice" role="note">
        <strong>Modo Demo:</strong> Letras simuladas automaticamente.{' '}
        Usa os botões <em>Confirmar</em> e <em>Apagar</em> para testar os gestos especiais.
      </div>
    </section>
  );
}