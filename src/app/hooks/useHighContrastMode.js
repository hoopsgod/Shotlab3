import { useEffect, useState } from "react";

const STORAGE_KEY = "sl:high-contrast";

export default function useHighContrastMode() {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setHighContrast(stored === "1");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    document.documentElement.classList.toggle("high-contrast", highContrast);
    window.localStorage.setItem(STORAGE_KEY, highContrast ? "1" : "0");
  }, [highContrast]);

  return { highContrast, setHighContrast };
}
