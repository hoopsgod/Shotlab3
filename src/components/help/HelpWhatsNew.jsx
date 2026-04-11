import React from "react";
import { HELP_TOPICS } from "../../help/helpContent";

const ORDER = ["logScore", "addEvent", "teamCode"];

export default function HelpWhatsNew({ isCoach = false }) {
  const topics = ORDER.map((key) => ({ key, ...HELP_TOPICS[key] })).filter((topic) => topic.title);

  return (
    <section className="accent-card" style={{ background: "var(--team-brand-card-bg, rgba(20,20,20,0.9))", border: "1px solid var(--team-brand-card-border, rgba(255,255,255,0.12))", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-2, #A0A0A0)", marginBottom: 6 }}>
        Help / What&apos;s New
      </div>
      <h2 style={{ margin: 0, fontSize: 22, letterSpacing: "0.06em" }}>Guides for key flows</h2>
      <p style={{ margin: "8px 0 16px", color: "var(--text-2, #A0A0A0)", fontSize: 12 }}>
        {isCoach ? "Coach-facing setup and workflow tips." : "Player-facing logging and onboarding tips."}
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {topics.map((topic) => (
          <article key={topic.key} style={{ border: "1px solid var(--team-brand-card-border, rgba(255,255,255,0.12))", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{topic.title}</div>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-2, #A0A0A0)" }}>{topic.shortHint}</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--text-1, #FFFFFF)" }}>
              {topic.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
