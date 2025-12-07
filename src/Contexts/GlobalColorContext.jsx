import { useContext, createContext, useState, useEffect } from "react";
import { useTheme } from "next-themes";

const GlobalColorContext = createContext(null);
export const useGlobalColorContext = () => useContext(GlobalColorContext);

const THEME_MAP = {
  light: {
    Text: "#111111",
    TextIO: "#000000",
    Button: "#f3f3f3",
    TransportButtons: "#111111",
    Background: "#ffffff",
    BackgroundIO: "#e5e5e5",
    Border: "#d4d4d4",
  },

  dark: {
    Text: "white",
    TextIO: "#ffffff",
    Button: "#1f1f1f",
    TransportButtons: "#e5e5e5",
    Background: "#111111",
    BackgroundIO: "#1e1e1e",
    Border: "#3f3f3f",
  },

  neon: {
    Text: "white",
    TextIO: "#7DF9FF",
    Button: "#140431",
    TransportButtons: "#ff0099",
    Background: "#0d0221",
    BackgroundIO: "#1c0641",
    Border: "#7DF9FF",
  },

  studio: {
    Text: "red",
    TextIO: "#FFFFFF",
    Button: "#2b2b2b",
    TransportButtons: "#FF8800",
    Background: "#1E1E1E",
    BackgroundIO: "#272727",
    Border: "#FF8800",
  },

  forest: {
    Text: "black",
    TextIO: "#d9ffe7",
    Button: "#10351c",
    TransportButtons: "#2ecc71",
    Background: "#0b2812",
    BackgroundIO: "#164226",
    Border: "#2ecc71",
  },
};

const GlobalColorContextProvider = ({ children }) => {
  const { theme } = useTheme();

  const [colorsComponent, setColorsComponent] = useState(
    THEME_MAP["dark"] // valeur par défaut
  );

  useEffect(() => {
    if (!theme) return;

    if (THEME_MAP[theme]) {
      setColorsComponent(THEME_MAP[theme]);
    } else {
      setColorsComponent(THEME_MAP["light"]); // fallback
    }
  }, [theme]);

  return (
    <GlobalColorContext.Provider value={{ colorsComponent, setColorsComponent }}>
      {children}
    </GlobalColorContext.Provider>
  );
};

export default GlobalColorContextProvider;
