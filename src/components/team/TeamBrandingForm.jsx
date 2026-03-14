import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_BRANDING } from "../../theme/brandingDefaults";

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
  { name: "logoUrl", label: "Logo URL", type: "url", placeholder: "https://..." },
  { name: "logoMarkUrl", label: "Logo Mark URL", type: "url", placeholder: "https://..." },
];

const FILE_TO_FIELD_MAP = {
  full: "logoUrl",
  mark: "logoMarkUrl",
};

const TEXT_SCALE_OPTIONS = [
  { key: "standard", label: "Default", hint: "Current ShotLab sizing" },
  { key: "large", label: "Large", hint: "More readable body and control text" },
  { key: "xl", label: "Extra Large", hint: "Strong readability while keeping hierarchy" },
];

function Field({ field, value, onChange }) {
  return (
    <label style={{ display: "grid", gap: 6, color: "#E5E7EB", fontSize: 12.5 }}>
      <span style={{ color: "rgba(229,231,235,0.88)", fontWeight: 600 }}>{field.label}</span>
      <input
        type={field.type}
        value={value || ""}
        placeholder={field.placeholder || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        style={{
          width: "100%",
          padding: field.type === "color" ? "3px 6px" : "10px 12px",
          minHeight: 42,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "#111620",
          color: "#E5E7EB",
        }}
      />
    </label>
  );
}

export default function TeamBrandingForm({ branding, onSave, onCancel, onChange, saving = false }) {
  const initial = useMemo(() => ({ ...DEFAULT_BRANDING, ...(branding || {}) }), [branding]);
  const [values, setValues] = useState(initial);
  const [uploadError, setUploadError] = useState("");
  const fullLogoInputRef = useRef(null);
  const markLogoInputRef = useRef(null);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  useEffect(() => {
    onChange?.(values);
  }, [onChange, values]);

  const selectedPaletteKey = useMemo(() => {
    const matched = APPROVED_BRAND_PALETTES.find((palette) => palette.primaryColor === values.primaryColor);
    return matched?.key || null;
  }, [values.primaryColor]);

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value || DEFAULT_BRANDING[name] || "" }));
  };

  const handlePaletteSelect = (palette) => {
    setValues((prev) => ({
      ...prev,
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      accentColor: palette.accentColor,
      textOnPrimary: palette.textOnPrimary,
    }));
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.readAsDataURL(file);
    });

  const handleLogoUpload = async (kind, file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG, JPG, SVG, etc).");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      handleChange(FILE_TO_FIELD_MAP[kind], dataUrl);
      setUploadError("");
    } catch (err) {
      setUploadError(err.message || "Could not load this image.");
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const safePalette = APPROVED_BRAND_PALETTES.find((palette) => palette.primaryColor === values.primaryColor) || APPROVED_BRAND_PALETTES[0];
    onSave?.({
      ...values,
      primaryColor: safePalette.primaryColor,
      secondaryColor: safePalette.secondaryColor,
      accentColor: safePalette.accentColor,
      textOnPrimary: safePalette.textOnPrimary,
    });
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      <section style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>Brand Colors</div>
          <div style={{ color: "#9CA3AF", fontSize: 12 }}>These colors flow through coach and player surfaces.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {APPROVED_BRAND_PALETTES.map((palette) => {
            const selected = selectedPaletteKey === palette.key;
            return (
              <button
                key={palette.key}
                type="button"
                onClick={() => handlePaletteSelect(palette)}
                style={{
                  display: "grid",
                  gap: 10,
                  textAlign: "left",
                  minHeight: 64,
                  borderRadius: 10,
                  padding: "10px 12px",
                  border: selected ? "1px solid rgba(157,255,122,0.9)" : "1px solid rgba(255,255,255,0.14)",
                  background: selected ? "rgba(157,255,122,0.1)" : "#111620",
                  boxShadow: selected ? "0 0 0 1px rgba(157,255,122,0.2) inset" : "none",
                  color: "#E5E7EB",
                  cursor: "pointer",
                }}
                aria-pressed={selected}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{palette.label}</span>
                  {selected ? <span style={{ fontSize: 11, color: "#9DFF7A", fontWeight: 700 }}>Selected</span> : null}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
                  {[palette.primaryColor, palette.secondaryColor, palette.accentColor, palette.textOnPrimary].map((swatch) => (
                    <span
                      key={swatch}
                      style={{
                        height: 16,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.24)",
                        background: swatch,
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ display: "grid", gap: 10, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>Text Size</div>
          <div style={{ color: "#9CA3AF", fontSize: 12 }}>Controls shared body, helper, button, input, and navigation labels.</div>
        </div>
        <div role="radiogroup" aria-label="Text size" style={{ display: "grid", gap: 8 }}>
          {TEXT_SCALE_OPTIONS.map((option) => {
            const selected = values.textScale === option.key;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => handleChange("textScale", option.key)}
                style={{
                  textAlign: "left",
                  minHeight: 42,
                  borderRadius: 10,
                  padding: "9px 12px",
                  border: selected ? "1px solid rgba(157,255,122,0.9)" : "1px solid rgba(255,255,255,0.14)",
                  background: selected ? "rgba(157,255,122,0.1)" : "#111620",
                  color: "#E5E7EB",
                  display: "grid",
                  gap: 2,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{option.label}</span>
                <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{option.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ display: "grid", gap: 10, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>Team Logos</div>
          <div style={{ color: "#9CA3AF", fontSize: 12 }}>Use a full logo and mark for cleaner placement across app headers and badges.</div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {LOGO_FIELDS.map((field) => (
            <Field key={field.name} field={field} value={values[field.name]} onChange={handleChange} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          <button
            type="button"
            onClick={() => fullLogoInputRef.current?.click()}
            style={{
              minHeight: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.04)",
              color: "#E5E7EB",
            }}
          >
            Upload Full Logo
          </button>
          <button
            type="button"
            onClick={() => markLogoInputRef.current?.click()}
            style={{
              minHeight: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.04)",
              color: "#E5E7EB",
            }}
          >
            Upload Logo Mark
          </button>
          <input
            ref={fullLogoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              handleLogoUpload("full", e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={markLogoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              handleLogoUpload("mark", e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {uploadError && <div style={{ color: "#FF8E8E", fontSize: 12 }}>{uploadError}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8 }}>
          <div style={{ minHeight: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#0D1118", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", overflow: "hidden" }}>
            {values.logoUrl ? (
              <img src={values.logoUrl} alt="Logo preview" style={{ maxWidth: "100%", maxHeight: 28, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 11, color: "#6B7280" }}>Full logo preview</span>
            )}
          </div>
          <div style={{ minHeight: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#0D1118", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, overflow: "hidden" }}>
            {values.logoMarkUrl ? (
              <img src={values.logoMarkUrl} alt="Logo mark preview" style={{ maxWidth: "100%", maxHeight: 22, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 11, color: "#6B7280" }}>Mark</span>
            )}
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          type="submit"
          disabled={saving}
          className="cta-primary"
          style={{
            width: "auto",
            margin: 0,
            minHeight: 42,
            borderRadius: 10,
            padding: "0 16px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.34)",
          }}
        >
          {saving ? "Saving..." : "Save Team Branding"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            minHeight: 42,
            borderRadius: 10,
            padding: "0 14px",
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.02)",
            color: "#E5E7EB",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
