import { useEffect, useMemo, useState } from "react";
import { DEFAULT_BRANDING } from "../../theme/brandingDefaults";

const COLOR_FIELDS = [
  { name: "primaryColor", label: "Primary Color", type: "color" },
  { name: "secondaryColor", label: "Secondary Color", type: "color" },
  { name: "accentColor", label: "Accent Color", type: "color" },
  { name: "textOnPrimary", label: "Text on Primary", type: "color" },
];

const LOGO_FIELDS = [
  { name: "logoUrl", label: "Logo URL", type: "url", placeholder: "https://..." },
  { name: "logoMarkUrl", label: "Logo Mark URL", type: "url", placeholder: "https://..." },
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

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  useEffect(() => {
    onChange?.(values);
  }, [onChange, values]);

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value || DEFAULT_BRANDING[name] || "" }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave?.(values);
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      <section style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>Brand Colors</div>
          <div style={{ color: "#9CA3AF", fontSize: 12 }}>These colors flow through coach and player surfaces.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {COLOR_FIELDS.map((field) => (
            <Field key={field.name} field={field} value={values[field.name]} onChange={handleChange} />
          ))}
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
