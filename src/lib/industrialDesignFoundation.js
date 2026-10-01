const STYLE_ID = "shotlab-industrial-design-foundation";

export const INDUSTRIAL_DESIGN_TOKENS = Object.freeze({
  canvas: "#f4f3ef",
  surface: "#ffffff",
  surfaceMuted: "#eeece6",
  ink: "#151719",
  inkMuted: "#62676b",
  line: "rgba(21,23,25,.09)",
  radius: "20px",
  shadow: "0 18px 55px rgba(26,30,33,.08)",
});

// Keep this legacy pre-mount layer intentionally tiny. The canonical authenticated
// 2026 authority resolves before React mounts and owns authenticated surfaces.
const CSS = `:root{color-scheme: light;}`;

export function installIndustrialDesignFoundation() {
  if (typeof document === "undefined") return false;
  if (document.getElementById(STYLE_ID)) return true;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.designSystem = "industrial-light-v1";
  style.textContent = CSS;
  document.head.appendChild(style);
  document.documentElement.dataset.shotlabDesign = "industrial-light-v1";
  return true;
}
