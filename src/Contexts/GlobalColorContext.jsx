import { useContext, createContext, useRef, useState } from "react";


const GlobalColorContext = createContext(null);
export const useGlobalColorContext = () => useContext(GlobalColorContext);



const GlobalColorContextProvider = ({ children }) => {
    const [colorsComponent, setColorsComponent] = useState({
        "Text": "white",
        "Button": "#ffffff",
        "Background": "gray.900",
        "Border": "#ffffff"
    });

    return (
        <GlobalColorContext.Provider value={{ colorsComponent, setColorsComponent }}>
            {children}
        </GlobalColorContext.Provider>
    );
};
export default GlobalColorContextProvider;