import { useContext, createContext } from "react";
import { useTheme } from "./ThemeContext"; 

const GlobalColorContext = createContext(null);
export const useGlobalColorContext = () => useContext(GlobalColorContext);

const GlobalColorContextProvider = ({ children }) => {
  const { themeStyles } = useTheme(); 

  // On expose directement les couleurs dérivées du theme
  const colorsComponent = {
    Text: themeStyles.text,
    TextIO: themeStyles.text,         
    Button: themeStyles.panel,
    TransportButtons: themeStyles.accent,
    Background: themeStyles.bg,
    BackgroundIO: themeStyles.panel,
    Border: themeStyles.accent,
  };

  return (
    <GlobalColorContext.Provider value={{ colorsComponent }}>
      {children}
    </GlobalColorContext.Provider>
  );
};

export default GlobalColorContextProvider;
