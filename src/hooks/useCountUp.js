import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const shouldReduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export function useCountUp(value, { durationMs = 800, easing = "easeOutCubic", enabled = true } = {}) {
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || shouldReduceMotion()) {
      setDisplayValue(value);
      return;
    }

    const easingFn = easing === "easeOutCubic" ? easeOutCubic : (t) => t;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easingFn(progress);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs, easing, enabled]);

  return displayValue;
}
