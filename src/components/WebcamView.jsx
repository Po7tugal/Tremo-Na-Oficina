/**
 * WebcamView.jsx — Webcam Display & Gesture Detection UI
 * --------------------------------------------------------
 * Renders the live camera feed, detection overlay, hold progress,
 * and controls to start/stop the camera.
 *
 * Dependencies: React, useWebcam hook
 * Used by: App.jsx
 */

import React from 'react';
import { useWebcam } from '../hooks/useWebcam.js';

/**
 * @param {Object} props
 * @param {Function} props.onLetter - Called with confirmed letter string
 * @param {boolean} props.disabled - Disable input (game over)
 */
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
    <section
      className="webcam-section"
      aria-label="Webcam and gesture recognition area"
    >
      <h2 className="section-title">
        <span className="section-icon" aria-hidden="true">📷</span>
        Camera View
      </h2>

      {/* Video container */}
      <div className="video-wrapper" role="img" aria-label="Live webcam feed">
        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          playsInline
          muted
          aria-label="Webcam video feed"
        />

        {/* Overlay when camera is not active */}
        {!isActive && (
          <div className="video-placeholder" aria-hidden="true">
            <div className="placeholder-icon">🖐</div>
            <p className="placeholder-text">
              {isRequesting ? 'Requesting camera...' : 'Camera off'}
            </p>
          </div>
        )}

        {/* Detection overlay — shows current letter being held */}
        {isActive && detection.letter && (
          <div
            className="detection-overlay"
            aria-live="polite"
            aria-label={`Detecting letter ${detection.letter}, confidence ${Math.round(detection.confidence * 100)} percent`}
          >
            <div className="detected-letter" aria-hidden="true">
              {detection.letter}
            </div>
            {/* Hold progress bar */}
            <div
              className="hold-progress-bar"
              role="progressbar"
              aria-valuenow={Math.round(detection.holdProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Hold progress"
            >
              <div
                className="hold-progress-fill"
                style={{ width: `${detection.holdProgress * 100}%` }}
              />
            </div>
            <div className="confidence-label" aria-hidden="true">
              {Math.round(detection.confidence * 100)}% confidence
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="error-banner" role="alert" aria-live="assertive">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Camera controls */}
      <div className="camera-controls">
        {!isActive ? (
          <button
            className="btn btn-primary"
            onClick={startCamera}
            disabled={isRequesting || disabled}
            aria-label="Start webcam for sign language detection"
          >
            {isRequesting ? '⏳ Starting...' : '▶ Start Camera'}
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={stopCamera}
            aria-label="Stop webcam"
          >
            ⏹ Stop Camera
          </button>
        )}
      </div>

      {/* Mock/simulation notice */}
      <div className="mock-notice" role="note">
        <strong>Demo Mode:</strong> Letters appear automatically to simulate
        gesture detection. In production, connect a trained ML model to the
        gesture recognition engine.
      </div>

      {/* Manual letter input for keyboard users / testing */}
      {!disabled && (
        <div className="manual-input-section" aria-label="Manual letter input for testing">
          <p className="manual-input-label">Or type a letter manually:</p>
          <div className="mini-keyboard" role="group" aria-label="Letter buttons">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
              <button
                key={letter}
                className="mini-key"
                onClick={() => simulateLetter(letter)}
                aria-label={`Insert letter ${letter}`}
                disabled={disabled}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}