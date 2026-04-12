import InfoHint from "./InfoHint";
import { dismissCoachmark, isCoachmarkDismissed } from "../../lib/helpStorage";

export default function HelpAnchor({ topicKey, coachmarkId, onOpenHelp, className = "" }) {
  const showCoachmark = coachmarkId ? !isCoachmarkDismissed(coachmarkId) : false;

  return (
    <span className={`sl-help-anchor ${className}`.trim()}>
      <InfoHint topicKey={topicKey} onOpenHelp={onOpenHelp} />
      {showCoachmark && (
        <button
          type="button"
          className="sl-help-coachmark"
          aria-label="Dismiss help tip"
          onClick={() => dismissCoachmark(coachmarkId)}
          title="Dismiss tip"
        >
          New
        </button>
      )}
    </span>
  );
}
