import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../src/App';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Player app root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
