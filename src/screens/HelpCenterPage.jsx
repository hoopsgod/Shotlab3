import React, { useEffect, useState } from "react";
import { HELP_TOPICS, RELEASE_NOTES } from "../help/helpContent";
import { getUnreadReleaseCount, markLatestReleaseSeen } from "../help/helpStorage";

export default function HelpCenterPage() {
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [unreadCount, setUnreadCount] = useState(() => getUnreadReleaseCount(RELEASE_NOTES));

  useEffect(() => {
    markLatestReleaseSeen(RELEASE_NOTES);
    setUnreadCount(getUnreadReleaseCount(RELEASE_NOTES));
  }, []);

  return (
    <div className="sl-help-page">
      <div className="sl-help-page__header">
        <div>
          <div className="sl-help-page__eyebrow">Help Center</div>
          <h1 className="sl-help-page__title">Help / What’s New</h1>
          <p className="sl-help-page__subtitle">
            Revisit feature guidance and recent product updates any time.
          </p>
        </div>

        {unreadCount > 0 && <span className="sl-help-page__badge">{unreadCount} new</span>}
      </div>

      <section className="sl-help-page__section">
        <h2>Guides</h2>

        <div className="sl-help-page__cards">
          {Object.entries(HELP_TOPICS).map(([key, topic]) => {
            const isOpen = expandedTopic === key;

            return (
              <article key={key} className="sl-help-card">
                <div className="sl-help-card__header">
                  <div>
                    <h3>{topic.title}</h3>
                    <p>{topic.shortHint}</p>
                  </div>

                  <button
                    type="button"
                    className="sl-help-card__toggle"
                    onClick={() => setExpandedTopic(isOpen ? null : key)}
                  >
                    {isOpen ? "Hide" : "Open"}
                  </button>
                </div>

                {isOpen && (
                  <ul className="sl-help-card__list">
                    {topic.details.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="sl-help-page__section">
        <h2>What’s New</h2>

        <div className="sl-help-page__cards">
          {RELEASE_NOTES.map((note) => (
            <article key={note.id} className="sl-help-card">
              <div className="sl-help-card__header">
                <div>
                  <h3>{note.title}</h3>
                  <p>
                    {note.version} · {note.date}
                  </p>
                </div>
              </div>

              <ul className="sl-help-card__list">
                {note.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
