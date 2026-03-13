import { useEffect, useState } from "react";
import { mergeBrandingWithDefaults } from "../../theme/brandingDefaults";
import TeamBrandingPreview from "./TeamBrandingPreview";

const FIELD_LABELS = {
  primaryColor: "Primary color",
  secondaryColor: "Secondary color",
  accentColor: "Accent color",
  textOnPrimary: "Text on primary",
  logoUrl: "Full logo URL",
  logoMarkUrl: "Logo mark URL",
};

export default function TeamBrandingForm({ branding, onSave, onUploadLogo, onUploadLogoMark }) {
  const [form, setForm] = useState(() => mergeBrandingWithDefaults(branding));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(mergeBrandingWithDefaults(branding));
  }, [branding]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave?.(form);
    setSaving(false);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section>
        <h3 style={{ margin: "0 0 10px", color: "#fff", fontSize: 14 }}>Brand Colors</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {Object.entries(FIELD_LABELS)
            .filter(([key]) => key.includes("Color") || key === "textOnPrimary")
            .map(([key, label]) => (
              <label key={key} style={{ display: "grid", gap: 6, color: "#9CA3AF", fontSize: 11 }}>
                {label}
                <input type="color" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
              </label>
            ))}
        </div>
        <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: "1px solid #2b3340" }}>
          <div style={{ background: form.primaryColor, color: form.textOnPrimary, padding: 10 }}>Primary block</div>
          <div style={{ background: form.secondaryColor, color: "#0B0D10", padding: 10 }}>Secondary block</div>
          <div style={{ background: form.accentColor, color: "#0B0D10", padding: 10 }}>Accent block</div>
        </div>
      </section>

      <section>
        <h3 style={{ margin: "0 0 10px", color: "#fff", fontSize: 14 }}>Team Logo</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "grid", gap: 6, color: "#9CA3AF", fontSize: 11 }}>
            {FIELD_LABELS.logoUrl}
            <input value={form.logoUrl} onChange={(e) => setField("logoUrl", e.target.value)} placeholder="https://..." />
          </label>
          <button type="button" onClick={() => onUploadLogo?.()} style={{ width: "fit-content" }}>
            Upload full logo (hook)
          </button>
          <label style={{ display: "grid", gap: 6, color: "#9CA3AF", fontSize: 11 }}>
            {FIELD_LABELS.logoMarkUrl}
            <input value={form.logoMarkUrl} onChange={(e) => setField("logoMarkUrl", e.target.value)} placeholder="https://..." />
          </label>
          <button type="button" onClick={() => onUploadLogoMark?.()} style={{ width: "fit-content" }}>
            Upload logo mark (hook)
          </button>
        </div>
      </section>

      <TeamBrandingPreview />

      <button type="button" className="pageHeaderPill pageHeaderPillBrand" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Team Branding"}
      </button>
    </div>
  );
}
