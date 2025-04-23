import { useState, useEffect } from "react";
import { ThemeContext } from "./authContextDef";
import { themes } from "./themeConstants";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("fontSize") || "medium"
  );
  const [compactMode, setCompactMode] = useState(
    () => localStorage.getItem("compactMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
    document.documentElement.setAttribute("data-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("compactMode", compactMode);
    document.documentElement.setAttribute("data-compact", compactMode);
  }, [compactMode]);

  const currentTheme = themes[theme] || themes.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        compactMode,
        setCompactMode,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
