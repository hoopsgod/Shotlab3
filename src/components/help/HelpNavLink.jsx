import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RELEASE_NOTES } from "../../help/helpContent";
import { getUnreadReleaseCount } from "../../help/helpStorage";

export default function HelpNavLink({ to = "/help", className = "" }) {
  const [unread, setUnread] = useState(() => getUnreadReleaseCount(RELEASE_NOTES));

  useEffect(() => {
    function refresh() {
      setUnread(getUnreadReleaseCount(RELEASE_NOTES));
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("shotlab:help-updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("shotlab:help-updated", refresh);
    };
  }, []);

  return (
    <Link to={to} className={className}>
      <span>Help / What’s New</span>
      {unread > 0 && <span className="sl-nav-badge">{unread}</span>}
    </Link>
  );
}
