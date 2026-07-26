import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_BRANDING } from "../../theme/brandingDefaults";
import useCleanTeamLogo, { cleanTeamLogoSource } from "../useCleanTeamLogo";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";
const FALLBACK_MARK = "/branding/titans-default-mark.svg";

const APPROVED_BRAND_PALETTES = [
  { key: "blue", label: "Blue", primaryColor: "#3B82F6", secondaryColor: "#93C5FD", accentColor: "#2563EB", textOnPrimary: "#EAF2FF" },
  { key: "red", label: "Red", primaryColor: "#EF4444", secondaryColor: "#FCA5A5", accentColor: "#DC2626", textOnPrimary: "#FFECEC" },
  { key: "green", label: "Green", primaryColor: "#22C55E", secondaryColor: "#86EFAC", accentColor: "#16A34A", textOnPrimary: "#E9FFEF" },
  { key: "gold", label: "Gold", primaryColor: "#EAB308", secondaryColor: "#FDE68A", accentColor: "#CA8A04", textOnPrimary: "#1C1500" },
  { key: "orange", label: "Orange", primaryColor: "#F97316", secondaryColor: "#FDBA74", accentColor: "#EA580C", textOnPrimary: "#FFF0E6" },
  { key: "purple", label: "Purple", primaryColor: "#A855F7", secondaryColor: "#D8B4FE", accentColor: "#9333EA", textOnPrimary: "#F6EDFF" },
  { key: "teal", label: "Teal", primaryColor: "#14B8A6", secondaryColor: "#99F6E4", accentColor: "#0D9488", textOnPrimary: "#E8FFFC" },
  { key: "steel", label: "Steel", primaryColor: "#64748B", secondaryColor: "#CBD5E1", accentColor: "#475569", textOnPrimary: "#F1F5F9" },
];

const LOGO_FIELDS = [
  { name: "logoUrl", label: "Full logo URL", type: "url", placeholder: "https://..." },
  { name: "logoMarkUrl", label: "Logo mark URL", type: "url", placeholder: "https://..." },
];

const FILE_TO_FIELD_MAP = { full: "logoUrl", mark: "logoMarkUrl" };

const TEXT_SCALE_OPTIONS = [
  { key: "standard", label: "Default", hint: "Current ShotLab sizing" },
  { key: "large", label: "Large", hint: "More readable body and control text" },
  { key: "xl", label: "Extra Large", hint: "Strong readability while keeping hierarchy" },
];

const inputStyle = {
  width: "100%",
  minHeight: 42,
  padding: "10px 12px",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 10,
  background: "#111620",
  color: "#E5E7EB",
};

function Field({ field, value, onChange }) {
  return (
    <label style={{ display: "grid", gap: 6, color: "#E5E7EB", fontSize: 12.5 }}>
      <span style={{ color: "rgba(229,231,235,0.88)", fontWeight: 600 }}>{field.label}</span>
      <input type={field.type} value={value || ""} placeholder={field.placeholder || ""} onChange={(event) => onChange(field.name, event.target.value)} style={inputStyle} />
    </label>
  );
}

function LogoPreview({ src, label }) {
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ minHeight: 82, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#050708", display: "grid", placeItems: "center", padding: 10, overflow: "hidden" }}>
          <img src={src} alt={`${label} on dark background`} style={{ width: "100%", height: 60, objectFit: "contain", filter: "drop-shadow(0 7px 12px rgba(0,0,0,.35))" }} />
        </div>
        <div style={{ minHeight: 82, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "linear-gradient(45deg,#e5e7eb 25%,#fff 25%,#fff 50%,#e5e7eb 50%,#e5e7eb 75%,#fff 75%) 0 0/18px 18px", display: "grid", placeItems: "center", padding: 10, overflow: "hidden" }}>
          <img src={src} alt={`${label} transparency preview`} style={{ width: "100%", height: 60, objectFit: "contain" }} />
        </div>
      </div>
    </div>
  );
}

export default function TeamBrandingForm({ branding, onSave, onCancel, onChange, saving = false }) {
  const initial = useMemo(() => ({ ...DEFAULT_BRANDING, ...(branding || {}) }), [branding]);
  const [values, setValues] = useState(initial);
  const [uploadError, setUploadError] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const fullLogoInputRef = useRef(null);
  const markLogoInputRef = useRef(null);
  const cleanFullLogo = useCleanTeamLogo(values.logoUrl || FALLBACK_LOGO);
  const cleanMarkLogo = useCleanTeamLogo(values.logoMarkUrl || FALLBACK_MARK);

  useEffect(() => { setValues(initial); }, [initial]);
  useEffect(() => { onChange?.(values); }, [onChange, values]);

  const selectedPaletteKey = useMemo(() => APPROVED_BRAND_PALETTES.find((palette) => palette.primaryColor === values.primaryColor)?.key || null, [values.primaryColor]);

  const handleChange = (name, value) => {
    setValues((previous) => ({ ...previous, [name]: value || DEFAULT_BRANDING[name] || "" }));
  };

  const handlePaletteSelect = (palette) => {
    setValues((previous) => ({ ...previous, primaryColor: palette.primaryColor, secondaryColor: palette.secondaryColor, accentColor: palette.accentColor, textOnPrimary: palette.textOnPrimary }));
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

  const handleLogoUpload = async (kind, file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setUploadError("Please upload a PNG, JPG, WebP, or SVG image.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setUploadError("Logo files must be smaller than 6 MB.");
      return;
    }
    try {
      setCleaning(true);
      const dataUrl = await fileToDataUrl(file);
      const transparentPng = await cleanTeamLogoSource(dataUrl);
      handleChange(FILE_TO_FIELD_MAP[kind], transparentPng);
      setUploadError("");
    } catch (error) {
      setUploadError(error.message || "Could not prepare this logo.");
    } finally {
      setCleaning(false);
    }
  };

  const cleanCurrentLogos = async () => {
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
  };

  const submit = (event) => {
    event.preventDefault();
    const safePalette = APPROVED_BRAND_PALETTES.find((palette) => palette.primaryColor === values.primaryColor) || APPROVED_BRAND_PALETTES[0];
    onSave?.({ ...values, primaryColor: safePalette.primaryColor, secondaryColor: safePalette.secondaryColor, accentColor: safePalette.accentColor, textOnPrimary: safePalette.textOnPrimary });
  };

  const sectionTitle = (title, description) => (
    <div style={{ display: "grid", gap: 3 }}>
      <div style={{ color: "#F3F4F6", fontSize: 13, fontWeight: 720, letterSpacing: -0.1 }}>{title}</div>
      <div style={{ color: "#929AA5", fontSize: 12, lineHeight: 1.45 }}>{description}</div>
    </div>
  );

  return (
    <form noValidate onSubmit={submit} style={{ display: "grid", gap: 18 }}>
      <section style={{ display: "grid", gap: 11 }}>
        {sectionTitle("Brand colors", "These colors flow through coach and player surfaces.")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {APPROVED_BRAND_PALETTES.map((palette) => {
            const selected = selectedPaletteKey === palette.key;
            return (
              <button key={palette.key} type="button" onClick={() => handlePaletteSelect(palette)} aria-pressed={selected} style={{ display: "grid", gap: 10, minHeight: 64, padding: "10px 12px", borderRadius: 10, border: selected ? "1px solid rgba(157,255,122,0.9)" : "1px solid rgba(255,255,255,0.14)", background: selected ? "rgba(157,255,122,0.1)" : "#111620", color: "#E5E7EB", textAlign: "left", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{palette.label}</span>{selected ? <span style={{ fontSize: 11, color: "#9DFF7A", fontWeight: 700 }}>Selected</span> : null}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>{[palette.primaryColor, palette.secondaryColor, palette.accentColor, palette.textOnPrimary].map((swatch) => <span key={swatch} style={{ height: 16, borderRadius: 999, border: "1px solid rgba(255,255,255,0.24)", background: swatch }} />)}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ display: "grid", gap: 10, paddingTop: 15, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {sectionTitle("Text size", "Controls shared body, helper, button, input, and navigation labels.")}
        <div role="radiogroup" aria-label="Text size" style={{ display: "grid", gap: 8 }}>
          {TEXT_SCALE_OPTIONS.map((option) => {
            const selected = values.textScale === option.key;
            return <button key={option.key} type="button" role="radio" aria-checked={selected} onClick={() => handleChange("textScale", option.key)} style={{ minHeight: 42, padding: "9px 12px", borderRadius: 10, border: selected ? "1px solid rgba(157,255,122,0.9)" : "1px solid rgba(255,255,255,0.14)", background: selected ? "rgba(157,255,122,0.1)" : "#111620", color: "#E5E7EB", display: "grid", gap: 2, textAlign: "left", cursor: "pointer" }}><span style={{ fontSize: 12.5, fontWeight: 700 }}>{option.label}</span><span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{option.hint}</span></button>;
          })}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12, paddingTop: 15, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {sectionTitle("Team logos", "Upload transparent PNG or SVG files when possible. ShotLab automatically removes simple flat backgrounds and saves the cleaned result as a PNG.")}
        <div style={{ display: "grid", gap: 10 }}>{LOGO_FIELDS.map((field) => <Field key={field.name} field={field} value={values[field.name]} onChange={handleChange} />)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          <button type="button" onClick={() => fullLogoInputRef.current?.click()} disabled={cleaning} style={{ minHeight: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)", color: "#E5E7EB" }}>Upload full logo</button>
          <button type="button" onClick={() => markLogoInputRef.current?.click()} disabled={cleaning} style={{ minHeight: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)", color: "#E5E7EB" }}>Upload logo mark</button>
          <input ref={fullLogoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={(event) => { handleLogoUpload("full", event.target.files?.[0]); event.target.value = ""; }} />
          <input ref={markLogoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={(event) => { handleLogoUpload("mark", event.target.files?.[0]); event.target.value = ""; }} />
        </div>
        <button type="button" onClick={cleanCurrentLogos} disabled={cleaning} style={{ minHeight: 40, borderRadius: 10, border: "1px solid rgba(200,255,26,0.34)", background: "rgba(200,255,26,0.06)", color: "#DFFF75", fontWeight: 700 }}>{cleaning ? "Preparing transparent logos…" : "Clean logo backgrounds"}</button>
        {uploadError ? <div style={{ color: "#FF929D", fontSize: 12, lineHeight: 1.4 }}>{uploadError}</div> : null}
        <LogoPreview src={cleanFullLogo} label="Full logo" />
        <LogoPreview src={cleanMarkLogo} label="Logo mark" />
      </section>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="submit" disabled={saving || cleaning} className="cta-primary" style={{ width: "auto", margin: 0, minHeight: 42, borderRadius: 10, padding: "0 16px", boxShadow: "0 6px 16px rgba(0,0,0,0.34)" }}>{saving ? "Saving..." : "Save team branding"}</button>
        <button type="button" onClick={onCancel} style={{ minHeight: 42, borderRadius: 10, padding: "0 14px", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.02)", color: "#E5E7EB" }}>Cancel</button>
      </div>
    </form>
  );
}
