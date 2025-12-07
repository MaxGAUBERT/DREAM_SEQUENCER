import { createContext, useContext, useMemo } from "react";
import { useTheme } from "next-themes";

const ThemeContext = createContext();

export function ThemeProviderContext({ children }) {
  const { theme } = useTheme();

  // Styles globaux par thème
  const themeStyles = useMemo(() => {
    switch (theme) {
      case "light":
        return {
          name: "light",
          bg: "#ffffff",
          text: "#111111",
          panel: "#f3f3f3",
          accent: "#2563eb",
        };

      case "dark":
        return {
          name: "dark",
          bg: "#111111",
          text: "#e5e5e5",
          panel: "#1e1e1e",
          accent: "#3b82f6",
        };

      case "neon":
        return {
          name: "neon",
          bg: "#0d0221",
          text: "#7DF9FF",
          panel: "#140431",
          accent: "#ff0099",
        };

      case "studio":
        return {
          name: "studio",
          bg: "#1E1E1E",
          text: "#FFD369",
          panel: "#2b2b2b",
          accent: "#FF8800",
        };

      case "forest":
        return {
          name: "forest",
          bg: "#0b2812",
          text: "#b5f7c8",
          panel: "#10351c",
          accent: "#2ecc71",
        };

      case "system":
      default:
        // next-themes gère system mais on choisit ici un fallback
        return {
          name: "system",
          bg: "#ffffff",
          text: "#111111",
          panel: "#f3f3f3",
          accent: "#2563eb",
        };
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeStyles }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);
