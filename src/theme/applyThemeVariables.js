export default function applyThemeVariables(cssVariables = {}) {
  if (typeof document === "undefined") return () => {};

  const rootStyle = document.documentElement.style;
  const previousValues = {};

  Object.entries(cssVariables).forEach(([key, value]) => {
    previousValues[key] = rootStyle.getPropertyValue(key);
    rootStyle.setProperty(key, value);
  });

  return () => {
    Object.entries(previousValues).forEach(([key, value]) => {
      if (value) {
        rootStyle.setProperty(key, value);
      } else {
        rootStyle.removeProperty(key);
      }
    });
  };
}
