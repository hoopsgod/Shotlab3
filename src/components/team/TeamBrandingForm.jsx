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

function Field({ field, value, onChange }) {
  return (
    <label className="team-branding-form__field">
      <span>{field.label}</span>
      <input
        type={field.type}
        value={value || ""}
        placeholder={field.placeholder || ""}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    </label>
  );
}

function LogoPreview({ src, label }) {
  return (
    <div className="team-branding-form__logo-preview">
      <div className="team-branding-form__logo-preview-label">{label}</div>
      <div className="team-branding-form__logo-preview-grid">
        <div className="team-branding-form__logo-canvas team-branding-form__logo-canvas--dark">
          <img src={src} alt={`${label} on dark background`} />
        </div>
        <div className="team-branding-form__logo-canvas team-branding-form__logo-canvas--transparent">
          <img src={src} alt={`${label} transparency preview`} />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="team-branding-form__section-heading">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function TeamBrandingForm({ branding, onSave, onCancel, onChange, saving = false }) {
  const initial = useMemo(() => ({ ...DEFAULT_BRANDING, ...(branding || {}) }), [branding]);
  const [values, setValues] = useState(initial);
  const [uploadError, setUploadError] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);
  const fullLogoInputRef = useRef(null);
  const markLogoInputRef = useRef(null);
  const cleanFullLogo = useCleanTeamLogo(values.logoUrl || FALLBACK_LOGO);
  const cleanMarkLogo = useCleanTeamLogo(values.logoMarkUrl || FALLBACK_MARK);

  useEffect(() => { setValues(initial); }, [initial]);
  useEffect(() => { onChange?.(values); }, [onChange, values]);

  const selectedPaletteKey = useMemo(
    () => APPROVED_BRAND_PALETTES.find((palette) => palette.primaryColor === values.primaryColor)?.key || null,
    [values.primaryColor],
  );

  const handleChange = (name, value) => {
    setValues((previous) => ({ ...previous, [name]: value || DEFAULT_BRANDING[name] || "" }));
  };

  const handlePaletteSelect = (palette) => {
    setValues((previous) => ({
      ...previous,
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      accentColor: palette.accentColor,
      textOnPrimary: palette.textOnPrimary,
    }));
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
    } catch {
      setUploadError("Could not prepare this logo. Try another image or enter a logo URL.");
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
      setUploadError("Could not clean this logo URL. Upload the file instead.");
    } finally {
      setCleaning(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving || cleaning || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setSubmitting(true);
    setUploadError("");
    const safePalette = APPROVED_BRAND_PALETTES.find((palette) => palette.primaryColor === values.primaryColor) || APPROVED_BRAND_PALETTES[0];
    try {
      await Promise.resolve(onSave?.({
        ...values,
        primaryColor: safePalette.primaryColor,
        secondaryColor: safePalette.secondaryColor,
        accentColor: safePalette.accentColor,
        textOnPrimary: safePalette.textOnPrimary,
      }));
    } catch (error) {
      const message = String(error?.message || "").trim();
      setUploadError(message || "Team branding could not be saved. Your changes are still here; try again.");
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const isBusy = saving || cleaning || submitting;

  return (
    <form noValidate onSubmit={submit} aria-busy={isBusy} className="team-branding-form">
      <section className="team-branding-form__section">
        <SectionHeading title="Brand colors" description="These colors flow through coach and player surfaces." />
        <div className="team-branding-form__palette-grid" aria-label="Approved team color palettes">
          {APPROVED_BRAND_PALETTES.map((palette) => {
            const selected = selectedPaletteKey === palette.key;
            return (
              <button
                key={palette.key}
                type="button"
                className="team-branding-form__palette"
                onClick={() => handlePaletteSelect(palette)}
                aria-pressed={selected}
              >
                <span className="team-branding-form__palette-label">
                  <span>{palette.label}</span>
                  {selected ? <span className="team-branding-form__selected-label">Selected</span> : null}
                </span>
                <span className="team-branding-form__swatches" aria-hidden="true">
                  {[palette.primaryColor, palette.secondaryColor, palette.accentColor, palette.textOnPrimary].map((swatch) => (
                    <span key={swatch} className="team-branding-form__swatch" style={{ background: swatch }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="team-branding-form__section">
        <SectionHeading title="Text size" description="Controls shared body, helper, button, input, and navigation labels." />
        <div role="radiogroup" aria-label="Text size" className="team-branding-form__option-list">
          {TEXT_SCALE_OPTIONS.map((option) => {
            const selected = values.textScale === option.key;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                className="team-branding-form__text-option"
                onClick={() => handleChange("textScale", option.key)}
              >
                <span className="team-branding-form__text-option-label">{option.label}</span>
                <span className="team-branding-form__text-option-hint">{option.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="team-branding-form__section">
        <SectionHeading
          title="Team logos"
          description="Upload PNG or SVG when possible. ShotLab removes simple flat backgrounds and saves a transparent PNG."
        />
        <div className="team-branding-form__field-list">
          {LOGO_FIELDS.map((field) => (
            <Field key={field.name} field={field} value={values[field.name]} onChange={handleChange} />
          ))}
        </div>
        <div className="team-branding-form__upload-grid">
          <button type="button" onClick={() => fullLogoInputRef.current?.click()} disabled={cleaning} className="team-branding-form__secondary-action">
            Upload full logo
          </button>
          <button type="button" onClick={() => markLogoInputRef.current?.click()} disabled={cleaning} className="team-branding-form__secondary-action">
            Upload logo mark
          </button>
          <input
            ref={fullLogoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            hidden
            onChange={(event) => {
              handleLogoUpload("full", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <input
            ref={markLogoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            hidden
            onChange={(event) => {
              handleLogoUpload("mark", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        <button type="button" onClick={cleanCurrentLogos} disabled={cleaning} className="team-branding-form__clean-action">
          {cleaning ? "Preparing transparent logos…" : "Clean logo backgrounds"}
        </button>
        {uploadError ? <div role="alert" className="team-branding-form__alert">{uploadError}</div> : null}
        <div className="team-branding-form__previews">
          <LogoPreview src={cleanFullLogo} label="Full logo" />
          <LogoPreview src={cleanMarkLogo} label="Logo mark" />
        </div>
      </section>

      <div className="team-branding-form__actions">
        <button type="submit" disabled={isBusy} className="cta-primary team-branding-form__save-action">
          {saving || submitting ? "Saving..." : "Save team branding"}
        </button>
        <button type="button" onClick={onCancel} disabled={isBusy} className="team-branding-form__cancel-action">
          Cancel
        </button>
      </div>
    </form>
  );
}
