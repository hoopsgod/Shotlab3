import React from "react";

const notices = {
  error: ["Follow-up data could not refresh.", "The player signal is unavailable right now."],
  permission: ["Follow-up data is unavailable for this account.", "Check the active team or sign in again."],
  unavailable: ["Follow-up service is unavailable.", "Player signals remain visible; try again later."],
};

export default function CoachCoreLoopPanel({ model = {}, onOpenPlayer, onOpenPlayers, onAddPlayer, onRetry, renderItem }) {
  const { requestState, state, openCount = 0, attentionItems = [], hasRoster, feedback } = model;
  const loading = requestState === "loading";
  const empty = requestState === "success" && state === "empty";
  const notice = notices[requestState];
  const local = model.storageMode === "local_only";
  const retry = requestState === "error" && model.storageMode === "local_fallback";
  const feedbackText = feedback ? feedback.state === "completed" ? retry ? `Follow-up recorded locally for ${feedback.name || "the player"}. Team sync needs a retry.` : local ? `Follow-up recorded in this session for ${feedback.name || "the player"}.` : `Follow-up recorded for ${feedback.name || "the player"}. The decision is cleared.` : `Follow-up saved for ${feedback.name || "the player"}.` : "";
  return <div className="coachCoreLoop" data-testid="coach-core-loop" data-state={state} data-request-state={requestState} data-open-count={openCount}>
    <div className="mcEvidenceEmpty"><small>Primary decision</small><strong>{openCount ? `${openCount} player${openCount === 1 ? "" : "s"} need${openCount === 1 ? "s" : ""} a next step` : "Player follow-up status"}</strong><small>{openCount ? "Why it matters: an activity gap can become a missed development touchpoint." : "Current roster signals and your last follow-up."}</small></div>
    {loading ? <div className="mcEvidenceEmpty" role="status" aria-busy="true">{hasRoster || attentionItems.length ? "Refreshing player attention…" : "Loading player attention…"}</div> : null}
    {notice ? <div className="mcEvidenceEmpty" role="alert"><strong>{notice[0]}</strong><small>{requestState === "error" && hasRoster ? "Showing the last known player signals." : notice[1]}</small><button className="mcTextLink" type="button" onClick={onRetry}>Retry</button></div> : null}
    {empty && !hasRoster ? <div className="mcEvidenceEmpty"><strong>No players to review yet.</strong><small>Add a player to see activity gaps and follow-up decisions here.</small><button className="mcTextLink" type="button" onClick={onAddPlayer}>Add first player</button></div> : null}
    {empty && hasRoster ? <div className="mcEvidenceEmpty"><strong>All player signals are clear.</strong><small>No open follow-up decisions are waiting. Completed records remain in context.</small><button className="mcTextLink" type="button" onClick={onOpenPlayers}>Open Players</button></div> : null}
    {attentionItems.length ? <div className="mcAttentionList" aria-label="Players needing attention">{attentionItems.slice(0, 3).map((item, index) => renderItem?.(item, onOpenPlayer, index))}</div> : null}
    {feedbackText ? <div className="mcEvidenceEmpty" data-testid="coach-core-loop-feedback" role="status"><strong>{feedbackText}</strong><small>{retry ? "Your local record is preserved." : "The player context is ready to review again from Players."}</small></div> : null}
    <button type="button" className="mcTextLink" onClick={onOpenPlayers}>Open player workspace</button>
  </div>;
}
