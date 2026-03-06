import './index.css';
import { App } from './App.js';

// Global Error Handler to catch hidden browser errors
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('app');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px; font-family: sans-serif;">
        <h2 style="margin-top:0">⚠️ Error de Aplicación</h2>
        <p>Se ha producido un error crítico al cargar la web:</p>
        <code style="display:block; background:rgba(0,0,0,0.05); padding:10px; margin:10px 0;">${message}</code>
        <p style="font-size: 0.8rem">Origen: ${source}:${lineno}</p>
        <button onclick="window.location.reload()" style="padding:8px 16px; cursor:pointer">Reintentar</button>
      </div>
    `;
  }
  return false;
};

// Mount application
try {
  const app = new App(document.getElementById('app'));
  app.mount().catch(err => {
    console.error('Mount error:', err);
    throw err; // Trigger window.onerror
  });
} catch (e) {
  console.error('Initialization error:', e);
}
