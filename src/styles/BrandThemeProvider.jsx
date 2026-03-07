import { useEffect } from "react";
import { brandTheme } from "./theme";

const toVars = (theme) => ({
  "--brand-primary": theme.colors.primary,
  "--brand-primary-deep": theme.colors.primaryDeep,
  "--brand-secondary": theme.colors.secondary,
  "--brand-secondary-deep": theme.colors.secondaryDeep,
  "--brand-neutral-900": theme.colors.neutral900,
  "--brand-neutral-800": theme.colors.neutral800,
  "--brand-neutral-700": theme.colors.neutral700,
  "--brand-neutral-500": theme.colors.neutral500,
  "--brand-neutral-300": theme.colors.neutral300,
  "--brand-neutral-100": theme.colors.neutral100,
  "--brand-success": theme.colors.success,
  "--brand-warning": theme.colors.warning,
  "--brand-danger": theme.colors.danger,
  "--brand-font-body": theme.typography.body,
  "--brand-font-heading": theme.typography.heading,
});

export default function BrandThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = toVars(brandTheme);
    Object.entries(cssVars).forEach(([key, value]) => root.style.setProperty(key, value));
  }, []);

  return children;
}
