import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../config/store.config.js';
import App from './App.jsx';
import './styles/global.css';
import './styles/store.css';

// El color de marca sale de config/store.config.js
document.documentElement.style.setProperty('--accent', store.accent);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
