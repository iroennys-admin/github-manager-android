import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const splash = document.getElementById('splash');
createRoot(document.getElementById('root')!).render(<App />);
requestAnimationFrame(() => {
  setTimeout(() => { splash?.classList.add('hide'); setTimeout(() => splash?.remove(), 500); }, 200);
});
