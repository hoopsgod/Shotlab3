import { DEFAULT_BRANDING } from "./brandingDefaults.js";

const HTTP_URL_RE = /^https?:\/\//i;
const BUNDLED_TITANS_LOGOS = [
  "/branding/titans-exact-logo.png.PNG",
  "/branding/titans-default-mark.svg",
  "/branding/titans-default-mark-free.svg",
];

function resolveLegacyColor(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function resolveTextScale(value) {
  return ["standard", "large", "xl"].includes(value) ? value : DEFAULT_BRANDING.textScale;
}

function isBundledTitansLogo(value) {
  const url = String(value || "");
  return BUNDLED_TITANS_LOGOS.some((candidate) => url.includes(candidate));
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
  const isDemoTitansIdentity = String(teamBranding?.teamName || "").trim().toLowerCase() === "demo titans";
  const suppliedLogoUrl = teamBranding?.logoUrl || "";
  const suppliedLogoMarkUrl = teamBranding?.logoMarkUrl || "";
  const logoUrl = !isDemoTitansIdentity && isBundledTitansLogo(suppliedLogoUrl) ? "" : suppliedLogoUrl;
  const logoMarkUrl = !isDemoTitansIdentity && isBundledTitansLogo(suppliedLogoMarkUrl) ? "" : suppliedLogoMarkUrl;
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
    logoUrl,
    logoMarkUrl,
    textScale: resolveTextScale(teamBranding?.textScale),
  };

  return {
    ...merged,
    logoUrl: withBrandingCacheBust(
      isDemoTitansIdentity && merged.logoUrl?.includes("/branding/titans-default-mark") ? DEFAULT_BRANDING.logoUrl : merged.logoUrl,
      merged
    ),
    logoMarkUrl: withBrandingCacheBust(merged.logoMarkUrl, merged),
  };
}