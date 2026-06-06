/**
 * SignReference.jsx — Sign Language Alphabet Reference
 * ------------------------------------------------------
 * Displays an accessible, interactive reference chart of all
 * ASL (American Sign Language) fingerspelling letters.
 *
 * Since we cannot rely on external images in an offline app,
 * each letter is represented by an SVG hand illustration.
 * These are simplified geometric representations intended
 * as visual aids.
 *
 * Dependencies: React
 * Used by: App.jsx
 */

import React, { useState } from 'react';

/**
 * SVG paths for simplified ASL hand signs.
 * Each entry is a simplified symbolic representation.
 * In a full production app, replace these with:
 *   - High-quality hand-drawn SVGs
 *   - Photographs from a creative commons licensed chart
 *   - Animated 3D hand models
 */
const SIGN_DESCRIPTIONS = {
  A: 'Closed fist with thumb to the side',
  B: 'Flat hand, fingers together, thumb folded in',
  C: 'Curved hand forming a C shape',
  D: 'Index finger pointing up, others curved to touch thumb',
  E: 'Fingers bent down, thumb tucked under',
  F: 'Index and thumb touch, other fingers up',
  G: 'Index and thumb pointing sideways',
  H: 'Index and middle fingers pointing sideways',
  I: 'Pinky finger up, fist closed',
  J: 'Pinky traces a J shape in the air',
  K: 'Index up, middle angled, thumb between them',
  L: 'L-shape with index up and thumb out',
  M: 'Three fingers folded over thumb',
  N: 'Two fingers folded over thumb',
  O: 'All fingers curve to touch thumb forming an O',
  P: 'K-shape pointing downward',
  Q: 'G-shape pointing downward',
  R: 'Index and middle fingers crossed',
  S: 'Fist with thumb over fingers',
  T: 'Thumb between index and middle finger',
  U: 'Index and middle fingers together pointing up',
  V: 'Index and middle fingers apart, V shape',
  W: 'Index, middle, ring fingers spread up',
  X: 'Index finger hooked',
  Y: 'Thumb and pinky extended',
  Z: 'Index finger traces a Z shape',
};

/**
 * A single sign card showing the letter and its description.
 * @param {{ letter: string, isHighlighted: boolean }} props
 */
function SignCard({ letter, isHighlighted }) {
  return (
    <div
      className={`sign-card ${isHighlighted ? 'sign-card--highlighted' : ''}`}
      role="listitem"
      aria-label={`${letter}: ${SIGN_DESCRIPTIONS[letter]}`}
    >
      {/* SVG placeholder — replace with real hand illustrations */}
      <div className="sign-illustration" aria-hidden="true">
        <svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" className="sign-svg">
          {/* Simple symbolic hand graphic — just a circle + letter */}
          <circle cx="40" cy="40" r="32" className="sign-circle" />
          <text
            x="40"
            y="48"
            textAnchor="middle"
            className="sign-svg-letter"
            fontSize="28"
            fontWeight="bold"
          >
            {letter}
          </text>
          {/* Stylized wrist */}
          <rect x="28" y="70" width="24" height="16" rx="4" className="sign-wrist" />
        </svg>
      </div>

      <div className="sign-info">
        <span className="sign-letter-label">{letter}</span>
        <span className="sign-description">{SIGN_DESCRIPTIONS[letter]}</span>
      </div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {string|null} props.highlightedLetter - Letter to highlight (currently detected)
 */
export function SignReference({ highlightedLetter }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="reference-section" aria-label="Sign language alphabet reference">
      <div className="reference-header">
        <h2 className="section-title">
          <span className="section-icon" aria-hidden="true">🤟</span>
          Sign Language Reference
        </h2>
        <button
          className="btn btn-ghost toggle-btn"
          onClick={() => setIsExpanded(e => !e)}
          aria-expanded={isExpanded}
          aria-controls="sign-grid"
        >
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <p className="reference-intro">
            Hold each hand sign in front of the camera for{' '}
            <strong>1.5 seconds</strong> to insert the letter.
            The highlighted card shows the currently detected letter.
          </p>

          <div
            id="sign-grid"
            className="sign-grid"
            role="list"
            aria-label="Sign language alphabet chart, A to Z"
          >
            {Object.keys(SIGN_DESCRIPTIONS).map(letter => (
              <SignCard
                key={letter}
                letter={letter}
                isHighlighted={highlightedLetter === letter}
              />
            ))}
          </div>

          <p className="reference-note" role="note">
            <strong>Note:</strong> Illustrations are simplified placeholders.
            For full accuracy, refer to an official ASL fingerspelling chart.
          </p>
        </>
      )}
    </section>
  );
}