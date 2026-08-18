import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const read = (file) => fs.readFileSync(path.resolve(cwd, file), "utf8");
const write = (file, content) => fs.writeFileSync(path.resolve(cwd, file), content);

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one source anchor, found ${count}`);
  return source.replace(before, after);
}

// The authoritative program name lives on the team record. Brand settings contain
// visual overrides, so merge the real team name into the shared branding context.
{
  const file = "src/App.jsx";
  let source = read(file);
  source = replaceOnce(
    source,
    'const resolvedTeamBranding=resolveTeamBranding(myTeam?.branding||DEFAULT_BRANDING);',
    'const resolvedTeamBranding=resolveTeamBranding({...(myTeam?.branding||{}),teamName:myTeam?.branding?.teamName||myTeam?.name||"Your Team"});',
    "Team identity App branding boundary"
  );
  write(file, source);
}

// Demo is a real program fixture, not a global product fallback. Give it explicit
// program branding so Demo and registered teams travel through the same title system.
{
  const file = "src/lib/demoData.js";
  let source = read(file);
  const before = `  return {
    id: teamId || DEMO_TEAM_ID,
    name: "Demo Titans",
    ownerCoachId: coachEmail || null,
    createdAt: DEMO_TIMESTAMP,
    joinCode: "DEMO26",
    updatedAt: Date.now(),
  };`;
  const after = `  return {
    id: teamId || DEMO_TEAM_ID,
    name: "Demo Titans",
    ownerCoachId: coachEmail || null,
    createdAt: DEMO_TIMESTAMP,
    joinCode: "DEMO26",
    branding: {
      teamName: "Demo Titans",
      primaryColor: "#C8FF1A",
      secondaryColor: "#9CA3AF",
      accentColor: "#C8FF1A",
      textOnPrimary: "#0B0D10",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
      logoMarkUrl: "/branding/titans-default-mark.svg",
      textScale: "standard",
    },
    updatedAt: Date.now(),
  };`;
  source = replaceOnce(source, before, after, "Demo team explicit branding fixture");
  write(file, source);
}

// Program Branding must never preview or save another program's crest when no logo
// exists. Empty logo state is deliberate; TeamIdentityTitleStage supplies initials.
{
  const file = "src/components/team/TeamBrandingForm.jsx";
  let source = read(file);
  source = replaceOnce(
    source,
    'const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";\nconst FALLBACK_MARK = "/branding/titans-default-mark.svg";',
    'const FALLBACK_LOGO = "";\nconst FALLBACK_MARK = "";',
    "Program Branding neutral logo fallback"
  );

  const beforePreview = `function LogoPreview({ src, label }) {
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ minHeight: 82, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#050708", display: "grid", placeItems: "center", padding: 10, overflow: "hidden" }}>
          <img src={src} alt={\`\${label} on dark background\`} style={{ width: "100%", height: 60, objectFit: "contain", filter: "drop-shadow(0 7px 12px rgba(0,0,0,.35))" }} />
        </div>
        <div style={{ minHeight: 82, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "linear-gradient(45deg,#e5e7eb 25%,#fff 25%,#fff 50%,#e5e7eb 50%,#e5e7eb 75%,#fff 75%) 0 0/18px 18px", display: "grid", placeItems: "center", padding: 10, overflow: "hidden" }}>
          <img src={src} alt={\`\${label} transparency preview\`} style={{ width: "100%", height: 60, objectFit: "contain" }} />
        </div>
      </div>
    </div>
  );
}`;
  const afterPreview = `function LogoPreview({ src, label }) {
  if (!src) {
    return (
      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600 }}>{label}</div>
        <div style={{ minHeight: 82, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.18)", background: "#0c1118", display: "grid", placeItems: "center", padding: 14, color: "#929AA5", fontSize: 12, lineHeight: 1.45, textAlign: "center" }}>No logo uploaded. ShotLab will use the team initials in title stages.</div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ minHeight: 82, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#050708", display: "grid", placeItems: "center", padding: 10, overflow: "hidden" }}>
          <img src={src} alt={\`\${label} on dark background\`} style={{ width: "100%", height: 60, objectFit: "contain", filter: "drop-shadow(0 7px 12px rgba(0,0,0,.35))" }} />
        </div>
        <div style={{ minHeight: 82, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "linear-gradient(45deg,#e5e7eb 25%,#fff 25%,#fff 50%,#e5e7eb 50%,#e5e7eb 75%,#fff 75%) 0 0/18px 18px", display: "grid", placeItems: "center", padding: 10, overflow: "hidden" }}>
          <img src={src} alt={\`\${label} transparency preview\`} style={{ width: "100%", height: 60, objectFit: "contain" }} />
        </div>
      </div>
    </div>
  );
}`;
  source = replaceOnce(source, beforePreview, afterPreview, "Program Branding empty logo preview");

  const beforeCleaner = `  const cleanCurrentLogos = async () => {
    try {
      setCleaning(true);
      const [full, mark] = await Promise.all([
        cleanTeamLogoSource(values.logoUrl || FALLBACK_LOGO),
        cleanTeamLogoSource(values.logoMarkUrl || FALLBACK_MARK),
      ]);
      setValues((previous) => ({ ...previous, logoUrl: full, logoMarkUrl: mark }));
      setUploadError("");
    } catch {
      setUploadError("The current logo URL could not be cleaned. Uploading the file directly usually works better.");
    } finally {
      setCleaning(false);
    }
  };`;
  const afterCleaner = `  const cleanCurrentLogos = async () => {
    const fullSource = values.logoUrl || FALLBACK_LOGO;
    const markSource = values.logoMarkUrl || FALLBACK_MARK;
    if (!fullSource && !markSource) {
      setUploadError("Add or upload a team logo before cleaning.");
      return;
    }
    try {
      setCleaning(true);
      const [full, mark] = await Promise.all([
        fullSource ? cleanTeamLogoSource(fullSource) : Promise.resolve(""),
        markSource ? cleanTeamLogoSource(markSource) : Promise.resolve(""),
      ]);
      setValues((previous) => ({ ...previous, logoUrl: full, logoMarkUrl: mark }));
      setUploadError("");
    } catch {
      setUploadError("The current logo URL could not be cleaned. Uploading the file directly usually works better.");
    } finally {
      setCleaning(false);
    }
  };`;
  source = replaceOnce(source, beforeCleaner, afterCleaner, "Program Branding empty logo cleaning guard");
  write(file, source);
}

console.log("Applied team-owned branding boundary, explicit Demo program branding, and neutral missing-logo behavior.");