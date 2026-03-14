import { DEFAULT_BRANDING } from "./brandingDefaults";

const HTTP_URL_RE = /^https?:\/\//i;

function resolveLegacyColor(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function resolveTextScale(value) {
  return ["standard", "large", "xl"].includes(value) ? value : DEFAULT_BRANDING.textScale;
}

function withBrandingCacheBust(url, branding) {
  if (!url || !HTTP_URL_RE.test(url)) return url || "";

  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://shotlab.local");
    const stamp = String(branding?.version || branding?.updatedAt || "").trim();
    if (stamp) parsed.searchParams.set("v", stamp);
    return parsed.toString();
  } catch {
    return url;
  }
}

export default function resolveTeamBranding(teamBranding = {}) {
  const legacyColors = teamBranding?.colors || {};
  const merged = {
    ...DEFAULT_BRANDING,
    ...(teamBranding || {}),
    primaryColor: resolveLegacyColor(teamBranding?.primaryColor || legacyColors.primary, DEFAULT_BRANDING.primaryColor),
    secondaryColor: resolveLegacyColor(teamBranding?.secondaryColor, DEFAULT_BRANDING.secondaryColor),
    accentColor: resolveLegacyColor(
      teamBranding?.accentColor || legacyColors.headerAccent || legacyColors.logoAccent,
      DEFAULT_BRANDING.accentColor
    ),
    textOnPrimary: resolveLegacyColor(teamBranding?.textOnPrimary || legacyColors.primaryText, DEFAULT_BRANDING.textOnPrimary),
    logoUrl: teamBranding?.logoUrl || "",
    logoMarkUrl: teamBranding?.logoMarkUrl || "",
    textScale: resolveTextScale(teamBranding?.textScale),
  };

  return {
    ...merged,
    logoUrl: withBrandingCacheBust(merged.logoUrl, merged),
    logoMarkUrl: withBrandingCacheBust(merged.logoMarkUrl, merged),
  };
}
