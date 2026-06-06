/**
 * main.jsx — Application Entry Point
 * ------------------------------------
 * Mounts the React app into the DOM.
 * Imports global CSS.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import './styles/tiles.css';
import './styles/webcam.css';
import './styles/reference.css';
import './styles/header.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);