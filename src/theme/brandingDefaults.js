export const brandingDefaults = {
  primaryColor: "#C8FF1A",
  secondaryColor: "#9CA3AF",
  accentColor: "#00E5FF",
  textOnPrimary: "#0B0D10",
  logoUrl: "",
  logoMarkUrl: "",
};

export function mergeBrandingWithDefaults(branding = {}) {
  return {
    ...brandingDefaults,
    ...(branding || {}),
  };
}
