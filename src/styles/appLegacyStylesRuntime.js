import TOKENS from "../theme/appTokens";
import legacyStyleModuleSource from "./appLegacyStyles.js?raw";
import { VISUAL_FOUNDATION_2026_CSS } from "./visualFoundation2026.js";

const LEGACY_STYLE_RUNTIME = Object.freeze({
  BG: TOKENS.BG_BASE,
  BORDER_CLR: TOKENS.BG_SUBTLE,
  CYAN: TOKENS.INFO,
  FB: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
  FD: "'Bebas Neue','Impact','Arial Black',sans-serif",
  ORANGE: TOKENS.WARNING,
  VOLT: TOKENS.PRIMARY,
});

function extractStyleTemplate(exportName) {
  const openingMarker = `export const ${exportName}=\``;
  const openingIndex = legacyStyleModuleSource.indexOf(openingMarker);

  if (openingIndex === -1) {
    throw new Error(`Legacy style export ${exportName} was not found.`);
  }

  const valueStart = openingIndex + openingMarker.length;
  const valueEnd = legacyStyleModuleSource.indexOf("`;", valueStart);

  if (valueEnd === -1) {
    throw new Error(`Legacy style export ${exportName} is not terminated.`);
  }

  let hydratedStyle = legacyStyleModuleSource.slice(valueStart, valueEnd);

  for (const [tokenName, tokenValue] of Object.entries(LEGACY_STYLE_RUNTIME)) {
    hydratedStyle = hydratedStyle.replaceAll(`\${${tokenName}}`, String(tokenValue));
  }

  const unresolvedTokens = hydratedStyle.match(/\$\{[A-Z_]+\}/g);
  if (unresolvedTokens?.length) {
    throw new Error(
      `Legacy style export ${exportName} has unresolved tokens: ${[...new Set(unresolvedTokens)].join(", ")}`,
    );
  }

  return hydratedStyle;
}

export const _STYLES_CSS = `${extractStyleTemplate("_STYLES_CSS")}\n${VISUAL_FOUNDATION_2026_CSS}`;
export const _PAGE_SIGNATURE_CSS = extractStyleTemplate("_PAGE_SIGNATURE_CSS");
export const _DESKTOP_SHELL_CSS = extractStyleTemplate("_DESKTOP_SHELL_CSS");
export const _PLAYER_COMPACT_DASHBOARD_CSS = extractStyleTemplate("_PLAYER_COMPACT_DASHBOARD_CSS");
