import { ReactNode } from 'react';
import PlayerSidebar from '../components/PlayerSidebar';
import PlayerWidgets from '../components/PlayerWidgets';

interface PlayerDashboardLayoutProps {
  children: ReactNode;
}

export default function PlayerDashboardLayout({ children }: PlayerDashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      {/* Left navigation (visible on lg+) */}
      <PlayerSidebar />

      {/* Main content */}
      <main className="flex-1 p-4 overflow-x-hidden">
        {children}
      </main>

      {/* Right widgets (visible on xl+) */}
      <PlayerWidgets />
    </div>
  );
}
