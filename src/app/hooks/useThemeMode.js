import { useMemo, useState } from "react";

export default function useThemeMode(themes, initialTheme = "dark") {
  const [theme, setTheme] = useState(initialTheme);

  const themeTokens = useMemo(() => themes[theme], [themes, theme]);

  return { theme, setTheme, themeTokens };
}
