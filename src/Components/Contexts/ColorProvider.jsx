import React, { useState, createContext, useContext } from "react";

export const ColorContext = createContext();
export const useColors = () => useContext(ColorContext);

export const ColorProvider = ({ children }) => {
  const [colors, setColors] = useState({
    backgroundColor: "#ffffff",
    panelColor: "gray",
    regularTextColor: "white",
    regularButtonColor: "#007bff",
    channelRackColor: "red",
    playlistColor: "#dddddd",
    browserColor: "#eeeeee",
    infoPanelColor: "#fafafa",
  });

  const updateColor = (key, value) => {
    setColors((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <ColorContext.Provider value={{ colors, updateColor }}>
      {children}
    </ColorContext.Provider>
  );
};

export default ColorProvider;