const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function expandHex(hex) {
  const color = hex.replace("#", "").trim();
  if (color.length === 3) {
    return `#${color
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }
  return `#${color}`;
}

export function normalizeHexColor(value, fallback) {
  if (typeof value !== "string") return expandHex(fallback);
  const trimmed = value.trim();
  if (!HEX_COLOR_RE.test(trimmed)) return expandHex(fallback);
  return expandHex(trimmed).toUpperCase();
}

export function hexToRgb(hex) {
  const normalized = expandHex(hex).replace("#", "");
  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbToHsl({ r, g, b }) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;

  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;

  let h = 0;
  if (delta) {
    if (max === rr) h = ((gg - bb) / delta) % 6;
    else if (max === gg) h = (bb - rr) / delta + 2;
    else h = (rr - gg) / delta + 4;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: (h * 60 + 360) % 360,
    s: s * 100,
    l: l * 100,
  };
}

function hslToRgb({ h, s, l }) {
  const ss = clamp(s, 0, 100) / 100;
  const ll = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hh >= 0 && hh < 1) {
    r1 = c;
    g1 = x;
  } else if (hh < 2) {
    r1 = x;
    g1 = c;
  } else if (hh < 3) {
    g1 = c;
    b1 = x;
  } else if (hh < 4) {
    g1 = x;
    b1 = c;
  } else if (hh < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = ll - c / 2;
  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

export function mixHex(colorA, colorB, weight = 0.5) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const w = clamp(weight, 0, 1);
  return rgbToHex({
    r: a.r + (b.r - a.r) * w,
    g: a.g + (b.g - a.g) * w,
    b: a.b + (b.b - a.b) * w,
  });
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(colorA, colorB) {
  const l1 = relativeLuminance(colorA);
  const l2 = relativeLuminance(colorB);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

export function resolveOnColor(backgroundColor, preferred) {
  const lightText = "#F3F4F6";
  const darkText = "#0B0D10";

  if (preferred && contrastRatio(backgroundColor, preferred) >= 4.5) {
    return preferred;
  }

  return contrastRatio(backgroundColor, darkText) >= contrastRatio(backgroundColor, lightText) ? darkText : lightText;
}

export function balanceBrandColor(hexColor) {
  const hsl = rgbToHsl(hexToRgb(hexColor));
  const normalized = {
    h: hsl.h,
    s: clamp(hsl.s, 32, 78),
    l: clamp(hsl.l, 38, 62),
  };
  return rgbToHex(hslToRgb(normalized));
}
