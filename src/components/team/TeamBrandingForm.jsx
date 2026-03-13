import { useMemo, useState } from "react";
import { DEFAULT_BRANDING } from "../../theme/brandingDefaults";

const FIELDS = [
  { name: "primaryColor", label: "Primary Color", type: "color" },
  { name: "secondaryColor", label: "Secondary Color", type: "color" },
  { name: "accentColor", label: "Accent Color", type: "color" },
  { name: "textOnPrimary", label: "Text on Primary", type: "color" },
  { name: "logoUrl", label: "Logo URL", type: "url", placeholder: "https://..." },
  { name: "logoMarkUrl", label: "Logo Mark URL", type: "url", placeholder: "https://..." },
];

export default function TeamBrandingForm({ branding, onSave, onCancel, saving = false }) {
  const initial = useMemo(() => ({ ...DEFAULT_BRANDING, ...(branding || {}) }), [branding]);
  const [values, setValues] = useState(initial);

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value || DEFAULT_BRANDING[name] || "" }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave?.(values);
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      {FIELDS.map((field) => (
        <label key={field.name} style={{ display: "grid", gap: 6, color: "#E5E7EB", fontSize: 13 }}>
          <span>{field.label}</span>
          <input
            type={field.type}
            value={values[field.name] || ""}
            placeholder={field.placeholder || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            style={{
              width: "100%",
              padding: field.type === "color" ? 4 : "10px 12px",
              minHeight: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "#141821",
              color: "#E5E7EB",
            }}
          />
        </label>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" disabled={saving} className="cta-primary" style={{ width: "auto", margin: 0, minHeight: 42 }}>
          {saving ? "Saving..." : "Save Team Branding"}
        </button>
        <button type="button" onClick={onCancel} style={{ minHeight: 42, borderRadius: 10, padding: "0 14px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#E5E7EB" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
