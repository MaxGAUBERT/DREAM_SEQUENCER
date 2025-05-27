import React, { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import ChannelRack from "./ComplexComponents/ChannelRack";
import Transport from "./ComplexComponents/Transport";
import StripMenu from "./FrontEnd/StripMenu";
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { Typography, Box, Container} from "@mui/material";
import PatternManager from "./ComplexComponents/PatternManager";
import ComponentManager from "./Contexts/ComponentManager";
import MainPanel from "./FrontEnd/MainPanel";
import ProjectManager from "./SystemTools/ProjectManager";
// imports de fonctions 
import {usePattern} from "./ComplexComponents/Functions/usePattern";
import { useChannels } from "./ComplexComponents/Functions/useChannels";
import { useStorage } from "./ComplexComponents/Functions/useStorage";
import { useTransport } from "./ComplexComponents/Functions/useTransport";

const Home = () => {
  // États principaux
  const [players, setPlayers] = useState({});
  const [channelSources, setChannelSources] = useState({});
  const [grids, setGrids] = useState({});
  const [patterns, setPatterns] = useState([{ players: {}, grids: {}, id: 1, name: "Pattern 1" }]);
  const [selectedPattern, setSelectedPattern] = useState("");
  const [projectName, setProjectName] = useState("");
  
  // États de l'interface
  const [stepRow, setStepRow] = useState(0);
  const [appKey, setAppKey] = useState(0);
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(50);
  const [loadView, setLoadView] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);
  const [infoOnMouseHover, setInfoOnMouseHover] = useState("");
  
  // États de lecture
  const [currentPlaylistRow, setCurrentPlaylistRow] = useState(0);
  const [currentPlaylistCol, setCurrentPlaylistCol] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songMode, setSongMode] = useState(false);
  
  const navigate = useNavigate();

  const {} = useTransport({ stepValue: stepRow, players, grids, setStepRow, onMouseEnter: setInfoOnMouseHover,
    onMouseLeave: setInfoOnMouseHover, setIsPlaying });

  // Initialisation de la playlist
  const [playlist, setPlaylist] = useState({
    initGrid: Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null)
    ),
  });

  // Hooks personnalisés
  const { addPattern, duplicatePattern, deletePattern } = usePattern({ patterns, setPatterns,
    selectedPattern, setSelectedPattern, players, channelSources, grids, setGrids, rows, cols,
  });

  const {
    handleSamplesUpdated,
    handleChannelsUpdated,
    handleUrlUpdated,
    handlePatternsUpdated,
    handleGridsUpdated,
  } = useChannels({ setPlayers, setChannelSources, setGrids, setPatterns, selectedPattern,
  });

  const {
    projectsList,
    handleSaveCurrentProject,
    handleSaveAs,
    handleLoadProject,
    clearProjects,
    datasToSave,
  } = useStorage({ patterns, channelSources, grids, playlist, setPatterns, setGrids, setProjectName, projectName, setPlaylist, setRows, setCols, setChannelSources, setPlayers, defaultRows: 8, defaultCols: 50,
  });

  // États des composants ouverts
  const [openComponents, setOpenComponents] = useState({
    ChannelRack: true,
    Browser: true,
    Playlist: false,
    "Melody Generator": false,
    Performer: false,
  });

  // Configuration des infos au survol
  const componentInfoMap = {
    "Browser": "Sound Browser",
    "Playlist": "Playlist",
    "Transport": "Transport",
    "ChannelRack": "Channel Rack",
  };

  // Gestionnaires d'événements pour le survol
  const handleMouseEnter = (componentName) => {
    setInfoOnMouseHover(componentInfoMap[componentName] || componentName);
  };
  
  const handleMouseLeave = () => {
    setInfoOnMouseHover("");
  };
  
  const handleSubMouseEnter = (label) => {
    setInfoOnMouseHover(label);
  };

  // Mise à jour des colonnes
  const handleColsChange = (newCols) => {
    setCols(newCols);
    
    setPlaylist((prev) => {
      const newGrid = Array.from({ length: rows }, (_, rowIdx) => 
        Array.from({ length: newCols }, (_, colIdx) => 
          colIdx < prev.initGrid[rowIdx]?.length 
            ? prev.initGrid[rowIdx][colIdx] 
            : null
        )
      );
      
      return {
        ...prev,
        initGrid: newGrid
      };
    });
  };

  const handleSelectPattern = (newSelectedPattern) => {
    console.log('🔄 Changement de pattern:', selectedPattern?.name, '→', newSelectedPattern?.name);
    
    // Sauvegarder les grilles du pattern actuel avant de changer
    if (selectedPattern?.id) {
      console.log('💾 Sauvegarde des grids du pattern actuel:', selectedPattern.id);
      setPatterns((prevPatterns) => {
        const updated = prevPatterns.map((pattern) =>
          pattern.id === selectedPattern.id
            ? { ...pattern, grids: { ...grids } } // Cloner les grids
            : pattern
        );
        console.log('📝 Patterns mis à jour:', updated);
        return updated;
      });
    }

    // Charger les grilles du nouveau pattern sélectionné
    setSelectedPattern(newSelectedPattern);
    if (newSelectedPattern?.grids) {
      console.log('📂 Chargement des grids du nouveau pattern:', newSelectedPattern.grids);
      setGrids({ ...newSelectedPattern.grids }); // Cloner les grids
    } else {
      console.log('⚠️ Aucune grid trouvée pour le pattern:', newSelectedPattern?.name);
      setGrids({});
    }
  };

  // Placement de pattern dans la playlist
  const handlePlacePattern = (row, col, pattern) => {
    setPlaylist((prev) => {
      const newGrid = [...prev.initGrid];
      newGrid[row][col] = pattern;
      return {
        ...prev,
        initGrid: newGrid
      };
    });
  };

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
    setPlaylist({ 
      initGrid: Array.from({ length: rows }, () => 
        Array.from({ length: cols }, () => null)
      ) 
    });
    
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

  // Effet pour s'assurer qu'un pattern est sélectionné et que les grilles sont synchronisées
  useEffect(() => {
    if (patterns.length > 0) {
      const patternExists = patterns.some(p => p.id === (selectedPattern?.id || -1));
      if (!patternExists) {
        const firstPattern = patterns[0];
        setSelectedPattern(firstPattern);
        setGrids(firstPattern.grids || {});
      }
    } else {
      setSelectedPattern(null);
      setGrids({});
    }
  }, [patterns]);


  return (
    <Box key={appKey}>
      <Typography
        variant="h3"
        sx={{
          display: "flex",
          flexDirection: "column",
          fontFamily: "Silkscreen, cursive",
          fontSize: "1.2rem",
          color: "white",
          position: "fixed",
          bottom: 0,
          right: 0
        }}
      >
        DREAM SEQUENCER - {projectName || "Untitled"}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", top: 0, right: 0, mt: 2 }}>
        <Transport 
          stepValue={cols}
          players={players}
          grids={grids}
          patterns={patterns}
          setStepRow={setStepRow}
          onMouseEnter={handleMouseEnter} 
          onMouseLeave={handleMouseLeave}
          setIsPlaying={setIsPlaying}  
        />
      </Box>

      <Container sx={{ mt: 4 }}>
        <GraphicEqIcon sx={{ 
          position: "fixed", 
          top: 0, 
          left: 15, 
          color: "white", 
          fontSize: "45px", 
          zIndex: 2 
        }} />
        
        <StripMenu
          componentsMap={openComponents}
          handleClickOnItem={handleMenuClick}
          openComponents={openComponents}
          setOpenComponents={setOpenComponents}
          onMouseEnter={() => handleMouseEnter("Manage components")}
          onMouseSubEnter={handleSubMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        
        <PatternManager
          patterns={patterns}
          selectedPattern={selectedPattern}
          selectPattern={handleSelectPattern}
          addPattern={addPattern}
          duplicatePattern={duplicatePattern}
          deletePattern={deletePattern}
          onMouseEnter={() => handleMouseEnter("Add / Delete / Duplicate patterns")}
          onMouseLeave={handleMouseLeave}
        />
      
        <ComponentManager
          openComponents={openComponents}
          playlistProps={{
            playlist,
            setPlaylist,
            rows,
            cols,
            setRows,
            setCols,
            onPlacePattern: handlePlacePattern,
            patterns,
            stepRow,
            currentPlaylistRow,     
            currentPlaylistCol,        
            isSongPlaying: isPlaying && songMode 
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {openComponents.ChannelRack && (
            <ChannelRack
              onSamplesUpdated={handleSamplesUpdated}
              onUrlUpdated={() => handleUrlUpdated(channelSources)}
              onChannelsUpdated={() => handleChannelsUpdated(Object.keys(players))}
              onGridsUpdated={handleGridsUpdated}
              onPatternsUpdated={() => handlePatternsUpdated(patterns)}
              patterns={patterns}
              selectedPattern={selectedPattern}
              stepRow={stepRow}
              resetFlag={appKey}
              onMouseEnter={() => handleMouseEnter("Add / Delete channels")}
              onMouseLeave={handleMouseLeave}
              onColsChange={handleColsChange}
              isPlaying={isPlaying}
            />
          )}
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
      </Container>
    </Box>
  );
};

export default Home;