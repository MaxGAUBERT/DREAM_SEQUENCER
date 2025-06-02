import React, { useCallback, useState } from "react";
import { itemsToMapForDisplay } from "../Contexts/JS/ItemsToMapForDisplay"; // Assurez-vous que ce chemin est correct

const StripMenu = React.memo(({ componentsMap, handleClickOnItem, openComponents, setOpenComponents, onMouseEnter: infos, onMouseLeave }) => {
  const [fileAnchor, setFileAnchor] = useState(null);
  const [editAnchor, setEditAnchor] = useState(null);
  const [viewAnchor, setViewAnchor] = useState(null);
  const [toolsAnchor, setToolsAnchor] = useState(null);

  const items = itemsToMapForDisplay();

  const handleOpenMenu = (setter) => (event) => {
    // Fermer tous les menus d'abord
    setFileAnchor(null);
    setEditAnchor(null);
    setViewAnchor(null);
    setToolsAnchor(null);
    // Puis ouvrir le menu demandé
    setter(event.currentTarget);
  };
  
  const handleCloseMenu = (setter) => () => setter(null);

  const handleOpenComponent = useCallback((component) => {
    setOpenComponents((prev) => ({
      ...prev,
      [component]: !prev[component], // toggle l'affichage
    }));
    setViewAnchor(null);
    setToolsAnchor(null);
  },[]);

  return (
    <div className="flex flex-col items-center">
      {/* Menu Strip */}
      <div className="absolute top-0 left-20 flex space-x-2 bg-gray-800 p-0.5 shadow-lg shadow-white/50 z-[1000]">
        {/* FILE */}
        <div className="relative">
          <button 
            className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out"
            onClick={handleOpenMenu(setFileAnchor)}
          >
            File
          </button>
          {fileAnchor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg min-w-[120px] z-[1001]">
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("New")} 
                onClick={() => handleClickOnItem("New")}
              >
                New
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Save As")} 
                onClick={() => handleClickOnItem("Save As")}
              >
                Save As
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Save")} 
                onClick={() => handleClickOnItem("Save")}
              >
                Save
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Load")} 
                onClick={() => handleClickOnItem("Load")}
              >
                Load
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Settings")} 
                onClick={() => handleClickOnItem("Settings")}
              >
                Settings
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Quit")} 
                onClick={() => handleClickOnItem("Quit")}
              >
                Quit
              </div>
            </div>
          )}
        </div>

        {/* EDIT */}
        <div className="relative">
          <button 
            className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out"
            onClick={handleOpenMenu(setEditAnchor)}
          >
            Edit
          </button>
          {editAnchor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg min-w-[120px] z-[1001]">
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onClick={handleCloseMenu(setEditAnchor)}
              >
                Undo
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onClick={handleCloseMenu(setEditAnchor)}
              >
                Redo
              </div>
            </div>
          )}
        </div>

        {/* VIEW */}
        <div className="relative">
          <button 
            className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out"
            onClick={handleOpenMenu(setViewAnchor)}
          >
            View
          </button>
          {viewAnchor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg min-w-[120px] z-[1001]">
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Channel Rack")} 
                onClick={() => handleOpenComponent("ChannelRack")}
              >
                ChannelRack
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Browser")}
                onClick={() => handleOpenComponent("Browser")}
              >
                Browser
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Playlist")}
                onClick={() => handleOpenComponent("Playlist")}
              >
                Playlist
              </div>
            </div>
          )}
        </div>

        {/* TOOLS */}
        <div className="relative">
          <button 
            className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out"
            onClick={handleOpenMenu(setToolsAnchor)}
          >
            Tools
          </button>
          {toolsAnchor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg min-w-[120px] z-[1001]">
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("AnalogSynth")}
                onClick={() => handleOpenComponent("AnalogSynth")}
              >
                Analog Synth
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                onMouseEnter={() => infos("Modulator")}
                onClick={() => handleOpenComponent("Modulator")}
              >
                Modulator
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay pour fermer les menus */}
      {(fileAnchor || editAnchor || viewAnchor || toolsAnchor) && (
        <div 
          className="fixed inset-0 z-[999]"
          onClick={() => {
            setFileAnchor(null);
            setEditAnchor(null);
            setViewAnchor(null);
            setToolsAnchor(null);
          }}
        />
      )}

      {/* Composants actifs affichés */}
      {Object.entries(openComponents).map(([componentName, isOpen]) => (
        isOpen && componentsMap[componentName] ? (
          <div key={componentName}>
            {componentsMap[componentName]}
          </div>
        ) : null
      ))}
    </div>
  );
});

export default StripMenu;