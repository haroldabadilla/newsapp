// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/* Load Bootstrap styles + JS (for navbar collapse/toggler) */
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

/* Your global theme styles */
import './styles/global.css';

/* Apply saved theme immediately (avoids flicker) */
import { initTheme } from './utils/theme.js';
initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);