import { useEffect } from "react";
import { markLatestReleaseSeen } from "../../lib/helpStorage";

export default function HelpWhatsNew({ releaseNotes = [] }) {
  useEffect(() => {
    markLatestReleaseSeen(releaseNotes);
  }, [releaseNotes]);

  return (
    <section className="sl-help-page">
      <h2>Help &amp; What&apos;s New</h2>
      {releaseNotes.map((note) => (
        <article key={note.id} className="sl-help-note">
          <header>
            <strong>{note.title}</strong>
            <span>{note.version}</span>
          </header>
          <p>{note.date}</p>
          <ul>
            {note.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
