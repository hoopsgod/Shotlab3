import { useEffect, useMemo, useState } from "react";
import { PREVIEW_MODE_STORAGE_KEY, PREVIEW_MODES, MOBILE_PREVIEW_MODES, isValidPreviewMode } from "../config/previewModes";

export default function usePreviewMode() {
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 960 : true));
  const [previewMode, setPreviewMode] = useState(() => {
    if (typeof window === "undefined") return PREVIEW_MODES.DESKTOP;
    const stored = window.localStorage.getItem(PREVIEW_MODE_STORAGE_KEY);
    return isValidPreviewMode(stored) ? stored : PREVIEW_MODES.DESKTOP;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewport = () => setIsDesktopViewport(window.innerWidth >= 960);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREVIEW_MODE_STORAGE_KEY, previewMode);
  }, [previewMode]);

  const activePreviewMode = isDesktopViewport ? previewMode : PREVIEW_MODES.MOBILE;
  const isMobilePreview = MOBILE_PREVIEW_MODES.has(activePreviewMode);

  const previewShellClass = isMobilePreview ? "viewport-preview-shell viewport-preview-shell--mobile" : "viewport-preview-shell viewport-preview-shell--desktop";
  const previewContentClass = useMemo(() => {
    if (!isMobilePreview) return "viewport-preview-content viewport-preview-content--desktop";
    return `viewport-preview-content viewport-preview-content--mobile ${activePreviewMode === PREVIEW_MODES.MOBILE_SMALL ? "viewport-preview-content--mobile-small" : ""} ${
      activePreviewMode === PREVIEW_MODES.MOBILE_LARGE ? "viewport-preview-content--mobile-large" : ""
    }`.trim();
  }, [activePreviewMode, isMobilePreview]);

  return {
    isDesktopViewport,
    previewMode,
    setPreviewMode,
    activePreviewMode,
    previewShellClass,
    previewContentClass,
  };
}
