import { createContext, useContext, useState } from "react";
import { useProjectManager } from "../Hooks/useProjectManager";


export const GlobalActionsContext = createContext(null);
export const useGlobalActions = () => useContext(GlobalActionsContext);

const GlobalActionsProvider = ({ children }) => {
  // toutes les actions liées aux projets


  const globalActions = {
    saveProject: saveProject,
    newProject: createProject,
    saveAsProject: saveAsProject,
    deleteProject: deleteProject,
    loadProject: loadProject
    
  };

  return (
    <GlobalActionsContext.Provider value={globalActions}>
      {children}
    </GlobalActionsContext.Provider>
  );
};


export default GlobalActionsProvider;