import { useEffect, useMemo, useRef, useState } from "react";

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return reducedMotion;
}

export default function CountUpValue({ value = 0, duration = 420, decimals = 0 }) {
  const parsedValue = useMemo(() => Number(value) || 0, [value]);
  const [displayValue, setDisplayValue] = useState(parsedValue);
  const frameRef = useRef(null);
  const previousValueRef = useRef(parsedValue);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(parsedValue);
      previousValueRef.current = parsedValue;
      return undefined;
    }

    const startValue = previousValueRef.current;
    const endValue = parsedValue;
    const delta = endValue - startValue;

    if (delta === 0) {
      setDisplayValue(endValue);
      return undefined;
    }

    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = startValue + delta * eased;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = endValue;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [duration, parsedValue, prefersReducedMotion]);

  return <span className="count-up-value">{displayValue.toFixed(decimals)}</span>;
}
