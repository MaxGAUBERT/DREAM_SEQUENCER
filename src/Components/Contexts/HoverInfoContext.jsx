import React, { createContext, useContext, useState, useCallback } from 'react';


// Création du contexte
const HoverInfoContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useHoverInfo = () => {
  const context = useContext(HoverInfoContext);
  if (!context) {
    throw new Error('useHoverInfo must be used within a HoverInfoProvider');
  }
  return context;
};

// Provider du contexte
export const HoverInfoProvider = ({ children }) => {
  const [infoOnMouseHover, setInfoOnMouseHover] = useState("");

  // Gestionnaires d'événements mémorisés
  const handleMouseEnter = useCallback((componentName) => {
    const info = componentName;
    setInfoOnMouseHover(info);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setInfoOnMouseHover("");
  }, []);

  // Fonction utilitaire pour créer des props de survol
  const createHoverProps = useCallback((componentName) => ({
    onMouseEnter: () => handleMouseEnter(componentName),
    onMouseLeave: handleMouseLeave
  }), [handleMouseEnter, handleMouseLeave]);

  // Valeur du contexte
  const contextValue = {
    infoOnMouseHover,
    handleMouseEnter,
    handleMouseLeave,
    createHoverProps,
    setInfoOnMouseHover // Au cas où vous auriez besoin de définir l'info manuellement
  };

  return (
    <HoverInfoContext.Provider value={contextValue}>
      {children}
    </HoverInfoContext.Provider>
  );
};