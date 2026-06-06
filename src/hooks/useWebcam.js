/**
 * useWebcam.js — Webcam & Gesture Recognition Hook
 * ---------------------------------------------------
 * Manages:
 *   - WebRTC camera access via navigator.mediaDevices.getUserMedia
 *   - Attaching the stream to a video element
 *   - Starting/stopping the GestureRecognizer pipeline
 *   - Exposing real-time detection state for the UI
 *
 * Dependencies: React, gestureRecognition.js
 * Used by: WebcamView component
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { gestureRecognizer } from '../utils/gestureRecognition.js';

/**
 * @typedef {Object} DetectionState
 * @property {string|null} letter - Currently detected letter
 * @property {number} confidence - Confidence score (0–1)
 * @property {number} holdProgress - Hold progress (0–1), 1 = accepted
 */

/**
 * @param {Function} onLetter - Called when a letter is confirmed (letter: string) => void
 */
export function useWebcam(onLetter) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraState, setCameraState] = useState('idle'); // idle | requesting | active | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [detection, setDetection] = useState({
    letter: null,
    confidence: 0,
    holdProgress: 0,
  });

  /**
   * Request webcam access and start the recognition pipeline.
   */
  const startCamera = useCallback(async () => {
    if (cameraState === 'active' || cameraState === 'requesting') return;
    setCameraState('requesting');
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize gesture recognizer with the video element
      gestureRecognizer.init(videoRef.current);
      gestureRecognizer.onLetter(onLetter);
      gestureRecognizer.onDetection(setDetection);
      gestureRecognizer.start();

      setCameraState('active');
    } catch (err) {
      console.error('[useWebcam] Camera error:', err);
      let msg = 'Camera access failed.';
      if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow camera access.';
      if (err.name === 'NotFoundError') msg = 'No camera found on this device.';
      if (err.name === 'NotReadableError') msg = 'Camera is in use by another application.';
      setErrorMessage(msg);
      setCameraState('error');
    }
  }, [cameraState, onLetter]);

  /**
   * Stop the camera and recognition pipeline.
   */
  const stopCamera = useCallback(() => {
    gestureRecognizer.stop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setDetection({ letter: null, confidence: 0, holdProgress: 0 });
    setCameraState('idle');
  }, []);

  /**
   * Simulate a letter (for testing / keyboard fallback).
   * @param {string} letter
   */
  const simulateLetter = useCallback((letter) => {
    gestureRecognizer.simulateLetter(letter);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gestureRecognizer.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    cameraState,
    errorMessage,
    detection,
    startCamera,
    stopCamera,
    simulateLetter,
  };
}