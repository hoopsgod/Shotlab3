import React from "react";
import { HELP_TOPICS } from "../../help/helpContent";

export default function InfoHint({ topicKey }) {
  const topic = HELP_TOPICS[topicKey];
  if (!topic) return null;

  return (
    <span
      className="sl-info-hint"
      role="note"
      aria-label={`Help: ${topic.title}`}
      title={topic.shortHint}
    >
      i
    </span>
  );
}
