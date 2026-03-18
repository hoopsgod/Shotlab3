import ReactDOM from 'react-dom/client';
import PlayerDashboardLayout from '../../layouts/PlayerDashboardLayout';
import HomePage from '../../features/player/HomePage';

function PlayerHome() {
  return (
    <PlayerDashboardLayout>
      <HomePage />
    </PlayerDashboardLayout>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<PlayerHome />);
