import { useState, useEffect, useCallback, useMemo } from "react";
import UI_TOKENS from "../../../styles/tokens";
import { DEFAULT_TEAM_BRANDING, LOGO_ALLOWED_TYPES, MIN_LOGO_RATIO, MAX_LOGO_RATIO } from "../constants/defaultTeamBranding";
import { sanitizeTeamBranding, contrastRatio, alphaFromHex } from "../utils/brandingUtils";

export default function useCoachBrandingState({ teamBranding, teamId, updateTeamBranding }) {
  const [brandingDraft, setBrandingDraft] = useState(() => sanitizeTeamBranding(teamBranding));
  const [brandingMsg, setBrandingMsg] = useState("");
  const [isLogoDragActive, setIsLogoDragActive] = useState(false);

  useEffect(() => {
    setBrandingDraft(sanitizeTeamBranding(teamBranding));
  }, [teamBranding]);

  const previewBranding = sanitizeTeamBranding(brandingDraft);
  const teamPrimary = previewBranding.useTeamColors ? previewBranding.primaryColor : DEFAULT_TEAM_BRANDING.primaryColor;
  const teamSecondary = previewBranding.useTeamColors ? previewBranding.secondaryColor : DEFAULT_TEAM_BRANDING.secondaryColor;

  const applyBrandingDraft = useCallback((patch) => {
    setBrandingDraft((prev) => ({ ...prev, ...patch }));
    setBrandingMsg("");
  }, []);

  const brandingContrast = contrastRatio(teamPrimary, teamSecondary);
  const brandingWarnings = useMemo(() => {
    const warnings = [];
    if (contrastRatio(teamPrimary, UI_TOKENS.colors.bgBase) < 3) warnings.push("Primary color may be hard to read on dark backgrounds.");
    if (contrastRatio(teamSecondary, UI_TOKENS.colors.bgBase) < 3) warnings.push("Secondary color may be hard to read on dark backgrounds.");
    if (brandingContrast < 3) warnings.push("Primary and secondary colors are too close together for clear contrast.");
    warnings.push("Guardrails: max 2 team colors, watermark opacity capped, and no more than 1–2 branded backgrounds per screen.");
    return warnings;
  }, [teamPrimary, teamSecondary, brandingContrast]);

  const shellVars = () => ({
    "--pageAccent": teamPrimary,
    "--pageAccentGlow": alphaFromHex(teamSecondary, 0.35),
    "--pageAccentBg": alphaFromHex(teamPrimary, 0.1),
    "--page-accent": teamPrimary,
    "--page-accent-soft": alphaFromHex(teamPrimary, 0.1),
    "--page-accent-border": alphaFromHex(teamSecondary, 0.35),
  });

  const validateAndReadLogoFile = (file) =>
    new Promise((resolve) => {
      if (!file) return resolve({ ok: false, msg: "No file selected" });
      if (!LOGO_ALLOWED_TYPES.includes(file.type)) return resolve({ ok: false, msg: "Logo must be PNG or JPG" });
      if (file.size > 2 * 1024 * 1024) return resolve({ ok: false, msg: "Logo must be under 2MB" });
      const reader = new FileReader();
      reader.onload = () => {
        const logoUrl = typeof reader.result === "string" ? reader.result : "";
        if (!logoUrl) return resolve({ ok: false, msg: "Could not read logo file" });
        const img = new Image();
        img.onload = () => {
          const ratio = img.naturalWidth / Math.max(img.naturalHeight, 1);
          if (ratio < MIN_LOGO_RATIO || ratio > MAX_LOGO_RATIO) {
            return resolve({ ok: false, msg: "Use a square or wide logo (roughly 1:1 to 3:1)." });
          }
          resolve({ ok: true, logoUrl });
        };
        img.onerror = () => resolve({ ok: false, msg: "Could not validate image dimensions" });
        img.src = logoUrl;
      };
      reader.onerror = () => resolve({ ok: false, msg: "Could not read logo file" });
      reader.readAsDataURL(file);
    });

  const handleLogoFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    const result = await validateAndReadLogoFile(file);
    if (!result.ok) {
      setBrandingMsg(result.msg);
      return;
    }
    applyBrandingDraft({ logoUrl: result.logoUrl });
    setBrandingMsg("Logo selected. Save team branding to publish.");
  };

  const handleLogoFileChange = async (event) => {
    await handleLogoFiles(event.target.files);
    event.target.value = "";
  };

  const applyBrandingPreset = (preset) => {
    if (!preset) return;
    setBrandingDraft((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
    }));
    setBrandingMsg("");
  };

  const saveBranding = async () => {
    const payload = sanitizeTeamBranding(brandingDraft);
    const r = await updateTeamBranding(teamId, payload);
    if (!r.ok) {
      setBrandingMsg(r.err || "Could not save branding");
      return;
    }
    setBrandingMsg("Branding saved");
  };

  return {
    brandingDraft,
    brandingMsg,
    previewBranding,
    teamPrimary,
    teamSecondary,
    coachAccent: teamPrimary,
    isLogoDragActive,
    setIsLogoDragActive,
    applyBrandingDraft,
    brandingWarnings,
    shellVars,
    handleLogoFiles,
    handleLogoFileChange,
    applyBrandingPreset,
    saveBranding,
  };
}
