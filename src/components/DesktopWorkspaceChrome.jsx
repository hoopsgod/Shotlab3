import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon.jsx";

// Both roles share the same mounted application chrome. Navigation stays with
// the existing role controller so this component never owns routing/history.
export function DesktopWorkspaceNavigation({ role, items, activeKey, onNavigate, userName }) {
  return <aside className="workspaceRail" aria-label={`${role} navigation`} data-testid="desktop-workspace-navigation">
    <div className="workspaceWordmark">SHOTLAB<span>{role} workspace</span></div>
    <nav aria-label={`${role} sections`}>
      {items.map(item => <button type="button" key={item.k} aria-current={activeKey === item.k ? "page" : undefined} onClick={() => onNavigate(item.k)}>
        {item.icon ? <ShotLabIcon name={item.icon} size={19} /> : item.svg || <ShotLabIcon name="home" size={19} />}<span>{item.l}</span>
      </button>)}
    </nav>
    <div className="workspaceUser"><span>{String(userName || role).slice(0, 1).toUpperCase()}</span><div><strong>{userName || role}</strong><small>{role} account</small></div></div>
  </aside>;
}

export function DesktopWorkspaceHeader({ role, title, onAccount, accountLabel, onLogout }) {
  const { branding } = useTeamBranding();
  const teamName = branding?.teamName || branding?.name || "Your team";
  const logo = branding?.logoMarkUrl || branding?.logoUrl;
  return <header className="workspaceHeader" data-testid="desktop-workspace-header">
    <div className="workspaceContext">{logo ? <img src={logo} alt="" /> : <span className="workspaceTeamInitial" aria-hidden="true">{teamName.slice(0, 1)}</span>}<div><span>{teamName} / {role}</span><h1>{title}</h1></div></div>
    <div className="workspaceHeaderActions"><button type="button" onClick={onAccount}>{accountLabel}</button><button type="button" onClick={onLogout}>Logout</button></div>
  </header>;
}
