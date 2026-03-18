import React from 'react';
import ReactDOM from 'react-dom/client';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Player demo root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <div
      style={{
        minHeight: '100vh',
        background: '#05070b',
        color: 'white',
        padding: '24px',
        fontSize: '24px'
      }}
    >
      PLAYER DEMO TEST
    </div>
  </React.StrictMode>
);
