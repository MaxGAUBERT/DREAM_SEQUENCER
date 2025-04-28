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
const Home = () => {
  const [players, setPlayers] = useState({});
  const [channelSources, setChannelSources] = useState({});
  const [grids, setGrids] = useState({});
  const [patterns, setPatterns] = useState([{ players: {}, grids: {}, id: 1, name: "Pattern 1" }]);
  const [selectedPattern, setSelectedPattern] = useState(patterns[0]);
  const [projectName, setProjectName] = useState("");
  const [stepRow, setStepRow] = useState(0);
  const [appKey, setAppKey] = useState(0);
  const [rows, setRows]  = useState(8);
  const [cols, setCols] = useState(16);
  const [loadView, setLoadView] = useState(false);
  const [projectsList, setProjectsList] = useState({});
  // Add missing state variables for playlist tracking
  const [currentPlaylistRow, setCurrentPlaylistRow] = useState(0);
  const [currentPlaylistCol, setCurrentPlaylistCol] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songMode, setSongMode] = useState(false);

  

  const navigate = useNavigate();

  // Initialisation de la playlist avec les dimensions correctes
  const [playlist, setPlaylist] = useState({
    initGrid: Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null) // null = cellule vide
    ),
  });

  const handleSamplesUpdated = (updatedPlayers) => setPlayers(updatedPlayers);
  const handleChannelsUpdated = (updatedChannels) => setPlayers(updatedChannels);

  // fonction de sauvegarde des éléments
   // Chargement initial des projets depuis localStorage
   useEffect(() => {
    const storedProjects = JSON.parse(localStorage.getItem("projects") || "{}");
    setProjectsList(storedProjects);
  }, []);

  // Sauvegarde du nom de projet
  useEffect(() => {
    if (projectName) {
      localStorage.setItem("projectName", projectName);
    }
  }, [projectName]);

  // Chargement du nom de projet
  useEffect(() => {
    const storedProjectName = localStorage.getItem("projectName");
    if (storedProjectName) {
      setProjectName(storedProjectName);
    }
  }, []);

  // Dans la fonction saveCurrentProject
const saveCurrentProject = () => {
  if (!projectName) return; // Ne pas sauvegarder sans nom de projet

  const dataToSave = { 
    players: channelSources, 
    grids, 
    patterns, 
    playlist: {
      initGrid: playlist.initGrid,
      rows: rows,  // Ajout des rows
      cols: cols   // Ajout des cols
    }
  };

  const storedProjects = JSON.parse(localStorage.getItem("projects") || "{}");
  storedProjects[projectName] = dataToSave;
  localStorage.setItem("projects", JSON.stringify(storedProjects));
  
  setProjectsList(storedProjects);
  console.log(`Projet "${projectName}" sauvegardé:`, dataToSave);
};

  const handleSaveAs = () => {
    // Demander un nouveau nom via prompt (à remplacer par un modal dans une version plus élaborée)
    const newName = prompt("Entrer un nom pour ce projet:", projectName || "");
    
    if (newName && newName.trim()) {
      setProjectName(newName.trim());
      
      // La sauvegarde sera déclenchée par l'effet qui surveille projectName
      // mais forçons-la immédiatement aussi
      const dataToSave = { 
        players: channelSources, 
        grids, 
        patterns, 
        playlist: {
          initGrid: playlist.initGrid,
          rows: rows,
          cols: cols
        }
      };
  
      const storedProjects = JSON.parse(localStorage.getItem("projects") || "{}");
      storedProjects[newName.trim()] = dataToSave;
      localStorage.setItem("projects", JSON.stringify(storedProjects));
      
      setProjectsList(storedProjects);
    }
  };
  
  
  const handleColsChange = (newCols) => {
    setCols(newCols);
    
    // Update the playlist grid if needed
    setPlaylist((prev) => {
      // Create a new grid with the new number of columns
      // but preserve existing data where possible
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
  // État pour l'information à afficher sur le panneau principal
  const [infoOnMouseHover, setInfoOnMouseHover] = useState("");
  

  const [openComponents, setOpenComponents] = useState({
    ChannelRack: true,
    Browser: true,
    Playlist: false,
    "Melody Generator": false,
    Performer: false,
  });

  // Mapping des noms de composants aux textes d'info
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
  
  const handleSelectPattern = (newSelectedPattern) => {
    console.log("🧠 Sauvegarde du pattern actuel :", selectedPattern);
    console.log("🎹 Grids à sauvegarder :", grids);
    
    setPatterns((prevPatterns) => {
      const updated = prevPatterns.map((pattern) =>
        pattern.id === selectedPattern.id
          ? { ...pattern, grids: grids }
          : pattern
      );
      console.log("✅ Patterns mis à jour :", updated);
      return updated;
    });
  
    setSelectedPattern(newSelectedPattern);
    setGrids(newSelectedPattern.grids);
  };
  
  const addPattern = () => {
    if (!Object.keys(players).length) return;
  
    const newId = patterns.length + 1;
    const instrumentGrids = {};
  
    // Use channelSources instead of players to ensure consistency
    Object.keys(channelSources).forEach(instrumentName => {
      // Initialize the grid properly with your desired dimensions
      instrumentGrids[instrumentName] = Array.from({ length: rows }, () => Array(cols).fill(false));
    });
  
    const newPattern = {
      players: { ...channelSources }, // Use channelSources here
      grids: instrumentGrids,
      id: newId,
      name: `Pattern ${newId}`
    };
  
    setPatterns([...patterns, newPattern]);
    setSelectedPattern(newPattern);
    // Also update the current grids to match the new pattern
    setGrids(instrumentGrids);
  };
  

  useEffect(() => {
    const storedProjectName = localStorage.getItem("projectName");
    if (storedProjectName) {
      setProjectName(storedProjectName);
    }
  }, []);

  useEffect(() => {
    if (patterns.length > 0) {
      const patternExists = patterns.some(p => p.id === (selectedPattern?.id || -1));
      if (!patternExists) {
        setSelectedPattern(patterns[0]);
      }
    } else {
      setSelectedPattern(null);
    }
  }, [patterns, players, grids]);
  

  
  

  const deletePattern = () => {
    if (!selectedPattern || Object.keys(players).length === 0) return;

    setPatterns((prevPatterns) => {
      if (prevPatterns.length === 1) return prevPatterns;

      const updatedPatterns = prevPatterns.filter(pattern => pattern.id !== selectedPattern.id);
      const reindexedPatterns = updatedPatterns.map((pattern, index) => ({
        ...pattern,
        id: index + 1,
        name: `Pattern ${index + 1}`
      }));

      const deletedIndex = prevPatterns.findIndex(p => p.id === selectedPattern.id);
      const newSelected = reindexedPatterns[Math.min(deletedIndex, reindexedPatterns.length - 1)];
      setSelectedPattern(newSelected);

      return reindexedPatterns;
    });
  };

  const handleGridsUpdated = (updatedGrids) => {
    setGrids(updatedGrids);
  
    // Met à jour les patterns avec les nouveaux grids pour le pattern sélectionné
    setPatterns((prevPatterns) =>
      prevPatterns.map((pattern) =>
        pattern.id === selectedPattern.id
          ? { ...pattern, grids: updatedGrids }
          : pattern
      )
    );
  };

  const handleUrlUpdated = (updatedUrl) => setChannelSources(updatedUrl);
  const handlePatternsUpdated = (updatedPatterns) => setPatterns(updatedPatterns);

  const handleMenuClick = (item) => {
    if (item === "New") {
      // Demander un nom pour le nouveau projet
      const newProjectName = prompt("Project name:");
      
      if (newProjectName && newProjectName.trim()) {
        // Réinitialiser l'application
        setAppKey(appKey + 1);
        setPatterns([{ players: {}, grids: {}, id: 1, name: "Pattern 1" }]);
        setGrids({});
        setPlayers({});
        setPlaylist({ initGrid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)) });
        
        // Définir le nouveau nom de projet
        setProjectName(newProjectName.trim());
      }
    }

    if (item === "Save As") {
      handleSaveAs();
    }

    if (item === "Save"){
      saveCurrentProject();
    }
    
    if (item === "Load") {
      setLoadView(!loadView);
    } 

    if (item === "Quit") {
      // Fermer l'application
      navigate("/");
    }

    if (item === "Undo") {
      handleUndo();
    }

    if (item === "Redo") {
      handleRedo();
    }
  };

  const handleLoadProject = (projectToLoad) => {
    if (projectToLoad) {
      // Mettre à jour le localStorage avec le nom du projet actif
      localStorage.setItem("projectName", projectToLoad.name);
  
      // Restaurer les états du projet
      setChannelSources(projectToLoad.players || {});
      setGrids(projectToLoad.grids || {});
      setPatterns(projectToLoad.patterns || []);
      
      // Restaurer la playlist avec sa structure complète
      if (projectToLoad.playlist) {
        // Si c'est un ancien format (juste initGrid)
        if (Array.isArray(projectToLoad.playlist)) {
          setPlaylist({ initGrid: projectToLoad.playlist });
        } 
        // Si c'est le nouveau format avec rows et cols
        else {
          setPlaylist({ 
            initGrid: projectToLoad.playlist.initGrid || [[]]
          });
          
          // Restaurer les dimensions
          if (projectToLoad.playlist.rows) setRows(projectToLoad.playlist.rows);
          if (projectToLoad.playlist.cols) setCols(projectToLoad.playlist.cols);
        }
      } else {
        setPlaylist({ initGrid: [[]] });
      }
  
      // Mettre à jour le pattern sélectionné
      if (projectToLoad.patterns && projectToLoad.patterns.length > 0) {
        setSelectedPattern(projectToLoad.patterns[0]);
      } else {
        setSelectedPattern(null);
      }
  
      setLoadView(false); // Fermer la vue de chargement
    }
  };
  

  const duplicatePattern = () => {
    if (!selectedPattern || Object.keys(players).length === 0) return;
  
    const newId = patterns.length + 1;
  
    // Create a deep copy of the current grids
    const deepCopyGrids = {};
    
    // Copy each instrument's grid from the current grids
    Object.keys(grids).forEach(instrumentId => {
      // Make sure we're creating a proper deep copy of each row
      deepCopyGrids[instrumentId] = grids[instrumentId].map(row => [...row]);
    });
  
    // Create the new pattern with a new ID
    const newPattern = {
      ...selectedPattern,
      id: newId,
      name: `Pattern ${newId}`,
      grids: deepCopyGrids // Add grids directly to the pattern
    };
  
    // Add the new pattern to patterns
    setPatterns(prevPatterns => [...prevPatterns, newPattern]);
    
    // Select the new pattern
    setSelectedPattern(newPattern);
    
    // Update the current grids to match the new pattern's grids
    setGrids(deepCopyGrids);
  };
  
  /*
  const handleNewProject = () => {
    setOpenComponents({
      ChannelRack: true,
      Browser: true,
      Playlist: false,
      "AnalogSynth": false,
      Modulator: false,
    });
    // Réinitialisation de la playlist
    setPlaylist({ initGrid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)) });
    setLoadView(false);
    nav("/");
  };
  */

    

  // Cette fonction est appelée par le composant Playlist quand un pattern est placé dans la grille
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
          playlist={playlist}
          patterns={patterns}
          setStepRow={setStepRow}
          onMouseEnter={handleMouseEnter} 
          onMouseLeave={handleMouseLeave}
          setIsPlaying={setIsPlaying}
          setSongMode={setSongMode}
          setCurrentPlaylistRow={setCurrentPlaylistRow}
          setCurrentPlaylistCol={setCurrentPlaylistCol}
        />
      </Box>
      <Container sx={{ mt: 4 }}>
        <GraphicEqIcon sx={{ position: "fixed", top: 0, left: 15, color: "white", fontSize: "50px" }} />
        
        <StripMenu
            componentsMap={openComponents}
            handleClickOnItem={handleMenuClick}
            openComponents={openComponents}
            setOpenComponents={setOpenComponents}
            onMouseEnter={() => handleMouseEnter("Manage components")}
            onMouseSubEnter={(label) => handleSubMouseEnter(label)}
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
            onMouseEnter={() => handleMouseEnter("Add / Delete channels") }
            onMouseLeave={handleMouseLeave}
            onColsChange={handleColsChange}
          />
        )}
        </ComponentManager>
        
        <MainPanel infoToDisplay={infoOnMouseHover} />

        {loadView && (
          <ProjectManager
            projects={projectsList}
            onLoadProject={(projectName) => {
              const savedProject = projectsList[projectName];
              if (savedProject) {
                setProjectName(projectName);
                handleLoadProject(savedProject);
              }
            }}
            onDeleteProject={() => localStorage.clear()}
            datasToSave={() => {
              if (patterns.length > 0) {
                return {
                  players: channelSources,
                  grids,
                  patterns,
                  playlist,
                  // Pas besoin de patternCount ici, on le calculera quand on chargera le projet
                };
              } else {
                return null;
              }
            }}  
            loadView={loadView}    
            setLoadView={setLoadView}
          />
        )}
      </Container>
    </Box>
  );
};

export default Home;
