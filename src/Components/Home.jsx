import React, { useState, useEffect, useReducer, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import ChannelRack from "./ComplexComponents/ChannelRack";
import Transport from "./ComplexComponents/Transport";
import StripMenu from "./FrontEnd/StripMenu";
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import PatternManager from "./ComplexComponents/PatternManager";
import ComponentManager from "./Contexts/ComponentManager";
import MainPanel from "./FrontEnd/MainPanel";
import ProjectManager from "./SystemTools/ProjectManager";
// imports de fonctions / hooks personnalisés
import { useChannels } from "./ComplexComponents/Hooks/useChannels";
import { useStorage } from "./ComplexComponents/Hooks/useStorage";
import { memoizedHandlers } from "./Contexts/memoizedHandlers";
import { usePatternManager } from "./ComplexComponents/Hooks/usePatternManager";
import { HoverInfoProvider, useHoverInfo } from "./Contexts/HoverInfoContext";

// Composant interne qui utilise le contexte
const HomeContent = () => {
  // Utilisation du contexte pour les infos de survol
  const { infoOnMouseHover, handleMouseEnter, handleMouseLeave } = useHoverInfo();
  
  // États principaux
  const [players, setPlayers] = useState({});
  const [channelSources, setChannelSources] = useState({});
  const [grids, setGrids] = useState({});
  const [patterns, setPatterns] = useState([{ players: {}, grids: {}, id: 1, name: "Pattern 1" }]);
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [projectName, setProjectName] = useState(localStorage.getItem("projectName") || "");
  // États de l'interface
  const [stepRow, setStepRow] = useState(0);
  const [appKey, setAppKey] = useState(0);
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(50);
  const [loadView, setLoadView] = useState(false);

  const { addPattern, duplicatePattern, deletePattern, handleSelectPattern
    } = usePatternManager({ patterns, setPatterns, selectedPattern, setSelectedPattern, players, channelSources, grids, setGrids,
  });

  const {handleSamplesUpdated, handleChannelsUpdated, handleUrlUpdated, handlePatternsUpdated, handleGridsUpdated,
    } = useChannels({ setPlayers, setChannelSources, setGrids, setPatterns, selectedPattern,
  });

  const {projectsList, handleSaveCurrentProject, handleSaveAs, handleLoadProject, clearProjects, datasToSave,
  } = useStorage({ patterns, channelSources, grids, setPatterns, setGrids, setProjectName, projectName, setRows, setCols, setChannelSources, setPlayers, defaultRows: 8, defaultCols: 50,
  });

  // États de lecture
  const [isPlaying, setIsPlaying] = useState(false);
  
  const navigate = useNavigate();

  // États des composants ouverts
  const [openComponents, setOpenComponents] = useState({
    ChannelRack: true,
    Browser: true,
    AnalogSynth: false,
    Modulator: false,
  });

  // Fonction pour créer un nouveau projet
  const createNewProject = (projectName) => {
    // Forcer un re-render complet
    setAppKey(prev => prev + 1);
    
    // Réinitialiser tous les états dans le bon ordre
    setPatterns([{ players: {}, grids: {}, id: 1, name: "Pattern 1" }]);
    setGrids({});
    setPlayers({});
    setChannelSources({});
    setSelectedPattern(null);
    // Définir le nom du projet
    setProjectName(projectName);
    
    console.log(`✅ Nouveau projet "${projectName}" créé`);
  };

  // Gestion du menu
  const handleMenuClick = (item) => {
    switch (item) {
      case "New":  
        const newProjectName = prompt("Project name:");
        if (newProjectName?.trim()) {
          createNewProject(newProjectName.trim());
        }
        break;
        
      case "Save As":
        handleSaveAs();
        break;
        
      case "Save":
        handleSaveCurrentProject();
        break;
        
      case "Load":
        setLoadView(!loadView);
        break;
        
      case "Quit":
        navigate("/");
        break;
        
      default:
        console.log(`Action "${item}" non implémentée`);
    }
  };

  const { callbacks } = memoizedHandlers({
    handleMouseEnter,
    handleMouseLeave,
    handleSamplesUpdated,
    handleUrlUpdated,
    handleChannelsUpdated,
    handleGridsUpdated,
    handlePatternsUpdated,
  });

  return (
    <div key={appKey}>
      <label
        variant="h3"
        className="text-white flex flex-col font-[Silkscreen] text-2xl absolute bottom-0 right-0"
      >
        DREAM SEQUENCER - {projectName}
      </label>
      <div>
        <GraphicEqIcon sx={{ 
          position: "fixed", 
          top: 0, 
          left: 15, 
          color: "white", 
          fontSize: "45px", 
          zIndex: 2 
        }} />

        <Transport />
        
        <StripMenu
          componentsMap={openComponents}
          handleClickOnItem={handleMenuClick}
          openComponents={openComponents}
          setOpenComponents={setOpenComponents}
        />
        
        <PatternManager
          patterns={patterns}
          selectedPattern={selectedPattern}
          selectPattern={handleSelectPattern}
          addPattern={addPattern}
          duplicatePattern={duplicatePattern}
          deletePattern={deletePattern}
        />

        <ComponentManager
          openComponents={openComponents}
        >
          <div style={{display: openComponents.ChannelRack ? "block" : "none"}}>
            <ChannelRack
              onSamplesUpdated={callbacks.handleSamplesUpdated}
              onUrlUpdated={() => callbacks.handleUrlUpdated(channelSources)}
              onChannelsUpdated={() => callbacks.handleChannelsUpdated(players)}
              onGridsUpdated={callbacks.handleGridsUpdated}
              onPatternsUpdated={() => callbacks.handlePatternsUpdated(patterns)}
              patterns={patterns}
              selectedPattern={selectedPattern}
              stepRow={stepRow}
              resetFlag={appKey}
              onColsChange={callbacks.handleColsChange}
              isPlaying={isPlaying}
            />
          </div>
        </ComponentManager>
        
        <MainPanel infoToDisplay={infoOnMouseHover} />

        {loadView && (
        <ProjectManager
          projects={projectsList}
          onLoadProject={(name) => {
            const saved = projectsList[name];
            if (saved) {
              console.log('🔄 Chargement du projet depuis Home:', name);
              console.log('📊 Données du projet:', saved);
              // Forcer un re-render complet AVANT de charger
              setAppKey(prev => prev + 1);
              // Attendre le prochain cycle de rendu avant de charger les données
              setTimeout(() => {
                handleLoadProject(name, saved);
                // S'assurer que le premier pattern est sélectionné après le chargement
                setTimeout(() => {
                  if (saved.patterns && saved.patterns.length > 0) {
                    const firstPattern = saved.patterns[0];
                    console.log('🎯 Sélection du premier pattern:', firstPattern);
                    setSelectedPattern(firstPattern);
                    if (firstPattern.grids) {
                      setGrids(firstPattern.grids);
                    }
                  }
                }, 100);
                
              }, 50);
              
              setLoadView(false);
            }
          }}
          onDeleteProject={clearProjects}
          datasToSave={datasToSave}
          loadView={loadView}
          setLoadView={setLoadView}
        />
      )}
      </div>
    </div>
  );
};

// Composant principal avec le Provider
const Home = () => {
  return (
    <HoverInfoProvider>
      <HomeContent />
    </HoverInfoProvider>
  );
};

export default Home;