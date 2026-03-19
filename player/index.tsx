import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from '../features/player/HomePage';
import PlayerDashboardLayout from '../layouts/PlayerDashboardLayout';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Player app root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <PlayerDashboardLayout>
      <HomePage />
    </PlayerDashboardLayout>
  </React.StrictMode>
);
