export const PREVIEW_MODE_STORAGE_KEY = "sl:preview-mode";

export const PREVIEW_MODES = {
  DESKTOP: "desktop",
  MOBILE: "mobile",
  MOBILE_SMALL: "mobile-small",
  MOBILE_LARGE: "mobile-large",
};

export const MOBILE_PREVIEW_MODES = new Set([
  PREVIEW_MODES.MOBILE,
  PREVIEW_MODES.MOBILE_SMALL,
  PREVIEW_MODES.MOBILE_LARGE,
]);

export const isValidPreviewMode = (value) => Object.values(PREVIEW_MODES).includes(value);
