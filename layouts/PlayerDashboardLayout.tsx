import { ReactNode } from 'react';
import PlayerSidebar from '../src/components/PlayerSidebar';
import PlayerWidgets from '../src/components/PlayerWidgets';
import { TeamBranding, TeamBrandingProvider } from '../src/branding/TeamBrandingProvider';

interface PlayerDashboardLayoutProps {
  children: ReactNode;
  teamBranding?: TeamBranding;
}

export default function PlayerDashboardLayout({ children, teamBranding }: PlayerDashboardLayoutProps) {
  return (
    <TeamBrandingProvider branding={teamBranding}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <PlayerSidebar />
          <main style={{ flex: 1, padding: '16px', overflowX: 'hidden' }}>{children}</main>
          <PlayerWidgets />
        </div>
      </div>
    </TeamBrandingProvider>
  );
}
