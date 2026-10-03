import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon.jsx";

// Both roles share the same mounted application chrome. Navigation stays with
// the existing role controller so this component never owns routing/history.
export function DesktopWorkspaceNavigation({ role, items, activeKey, onNavigate }) {
  return <aside className="workspaceRail" aria-label={`${role} navigation`} data-testid="desktop-workspace-navigation">
    <div className="workspaceWordmark">SHOTLAB<span>{role} workspace</span></div>
    <nav aria-label={`${role} sections`}>
      {items.map(item => <button type="button" key={item.k} aria-current={activeKey === item.k ? "page" : undefined} onClick={() => onNavigate(item.k)}>
        {item.icon ? <ShotLabIcon name={item.icon} size={19} /> : item.svg}<span>{item.l}</span>
      </button>)}
    </nav>
  </aside>;
}

export function DesktopWorkspaceHeader({ title, onLogout }) {
  const { branding } = useTeamBranding();
  const teamName = branding?.teamName || "Your team";
  const logo = branding?.logoMarkUrl || branding?.logoUrl;
  return <header className="workspaceHeader" data-testid="desktop-workspace-header">
    <div className="workspaceContext">{logo && <img src={logo} alt="" />}<div><span>{teamName}</span><h1>{title}</h1></div></div>
    <button type="button" onClick={onLogout}>Logout</button>
  </header>;
}
