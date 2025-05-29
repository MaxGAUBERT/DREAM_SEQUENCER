import React, { useState, useEffect, useCallback} from "react";
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
import { useMemoizedHandlers } from "./Contexts/memoizedHandlers";


const Home = () => {
  // États principaux
  const [players, setPlayers] = useState({});
  const [channelSources, setChannelSources] = useState({});
  const [grids, setGrids] = useState({});
  const [patterns, setPatterns] = useState([{ players: {}, grids: {}, id: 1, name: "Pattern 1" }]);
  const [selectedPattern, setSelectedPattern] = useState("");
  const [projectName, setProjectName] = useState("");
  // pour le transport
  const [bpm, setBPM] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSequence, setRecordedSequence] = useState([]);
  
  // États de l'interface
  const [stepRow, setStepRow] = useState(0);
  const [appKey, setAppKey] = useState(0);
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(50);
  const [loadView, setLoadView] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);
  const [infoOnMouseHover, setInfoOnMouseHover] = useState("");

  
  // États de lecture
  const [isPlaying, setIsPlaying] = useState(false);
  
  const navigate = useNavigate();

    // Gestionnaires d'événements pour le survol
  const handleMouseEnter = (componentName) => {
    setInfoOnMouseHover(componentInfoMap[componentName] || componentName);
  };
  
  const handleMouseLeave = () => {
    setInfoOnMouseHover("");
  };

  const componentInfoMap = {
    "Browser": "Sound Browser",
    "Playlist": "Playlist",
    "Transport": "Transport",
    "StripMenu": "Strip Menu",
    "AnalogSynth": "View Analog Synth",
    "Modulator": "View Modulator",
    "New": "Create a new project",
    "Save As": "Save project As",
    "Save": "Save current project",
    "Load": "Load an existing project",
    "Settings": "Change settings",
    "Quit": "Quit the application",
    "ChannelRack": "Add / Delete channels",
    "ChRackUpload": "Load a sample",
    "ChRackPiano": "Add pianoRoll",
    "ChRackDelete": "Delete a channel",
    "ChRackRename": "Rename a channel",
    "ChRackCreate": "Confirm channel to add",
    "ChRackAdd": "Add a new channel",
    "Play Song": "Play in song mode", 
    "Play Pattern": "Play current pattern",
    "Stop Song": "Stop the song",
    "Stop Pattern": "Stop current pattern", 
    "Record": "Record sequence", 
    "Replay": "Replay recorded sequence", 
    "Clear": "Clear recorded sequence", 
    "BPM": "Adjust BPM",
    "LoopMode": "Toggle Loop Mode",
    "SongMode": "Toggle Song Mode",
    "PatternMode": "Toggle Pattern Mode",
    "ChReset": "Set default channels"
  };

  // Hooks personnalisés
  const { addPattern, duplicatePattern, renamePattern, deletePattern } = usePattern({ patterns, setPatterns,
    selectedPattern, setSelectedPattern, players, channelSources, grids, setGrids, rows, cols,
  });

  const {handleSamplesUpdated, handleChannelsUpdated, handleUrlUpdated, handlePatternsUpdated, handleGridsUpdated,
  } = useChannels({ setPlayers, setChannelSources, setGrids, setPatterns, selectedPattern,
  });


  const {
    projectsList,
    handleSaveCurrentProject,
    handleSaveAs,
    handleLoadProject,
    clearProjects,
    datasToSave,
  } = useStorage({ patterns, channelSources, grids, setPatterns, setGrids, setProjectName, projectName, setRows, setCols, setChannelSources, setPlayers, defaultRows: 8, defaultCols: 50,
  });

  // États des composants ouverts
  const [openComponents, setOpenComponents] = useState({
    ChannelRack: true,
    Browser: true,
    Playlist: false,
    AnalogSynth: false,
    Modulator: false,
  });

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

  const { mouse, callbacks } = useMemoizedHandlers({
    handleMouseEnter,
    handleMouseLeave,
    handleSamplesUpdated,
    handleUrlUpdated,
    handleChannelsUpdated,
    handleGridsUpdated,
    handlePatternsUpdated,
  });

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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        
        <PatternManager
          patterns={patterns}
          selectedPattern={selectedPattern}
          selectPattern={handleSelectPattern}
          addPattern={addPattern}
          duplicatePattern={duplicatePattern}
          renamePattern={renamePattern}
          deletePattern={deletePattern}
          onMouseEnter={mouse.onPatternMouseEnter}
          onMouseLeave={mouse.onMouseLeave}
        />

        <ComponentManager
          openComponents={openComponents}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Box style={{display: openComponents.ChannelRack ? "block" : "none"}}>
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
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onColsChange={callbacks.handleColsChange}
              isPlaying={isPlaying}
            />
          </Box>
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