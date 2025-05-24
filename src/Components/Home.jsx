import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChannelRack from "./ComplexComponents/ChannelRack";
import Transport from "./ComplexComponents/Transport";
import StripMenu from "./FrontEnd/StripMenu";
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { Typography, Box, Container} from "@mui/material";
import PatternManager from "./ComplexComponents/PatternManager";
import ComponentManager from "./Contexts/ComponentManager";
import MainPanel from "./FrontEnd/MainPanel";
import { usePatterns } from "./ComplexComponents/Functions/usePatterns";
import ProjectManager from "./SystemTools/ProjectManager";

const Home = () => {
    // États de base optimisés
    const [players, setPlayers] = useState({});
    const [channelSources, setChannelSources] = useState({});
    const [grids, setGrids] = useState({});
    const [patterns, setPatterns] = useState([{ players: {}, grids: {}, id: 1, name: "Pattern 1" }]);
    const [selectedPattern, setSelectedPattern] = useState(patterns[0]);
    const [projectName, setProjectName] = useState("");
    const [stepRow, setStepRow] = useState(0);
    const [appKey, setAppKey] = useState(0);
    // États des dimensions - centralisés
    const [rows, setRows] = useState(8);
    const [cols, setCols] = useState(16); // Valeur par défaut plus raisonnable
    // États de l'interface
    const [loadView, setLoadView] = useState(false);
    const [projectsList, setProjectsList] = useState({});
    const [isPlaying, setIsPlaying] = useState(false);
    const [songMode, setSongMode] = useState(false);
    const [infoOnMouseHover, setInfoOnMouseHover] = useState("");

    const { addPattern, duplicatePattern, deletePattern
    } = usePatterns({ patterns, setPatterns, selectedPattern, setSelectedPattern, channelSources, players, setGrids, grids, rows, cols });

    // Initialisation optimisée de la playlist avec useMemo
    const [playlist, setPlaylist] = useState(() => ({
      initGrid: Array.from({ length: 8 }, () => Array.from({ length: 16 }, () => null))
    }));

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
      setPlayers(projectToLoad.players || {});
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

    useEffect(() => {
      if (projectName) {
        localStorage.setItem("projectName", projectName);
      }
    }, [projectName]);

    useEffect(() => {
      const storedProjectName = localStorage.getItem("projectName");
      if (storedProjectName) {
        setProjectName(storedProjectName);
      }
    }, [setProjectName]);

    const [openComponents, setOpenComponents] = useState({
      ChannelRack: true,
      Browser: true,
      Playlist: false,
      "Melody Generator": false,
      Performer: false,
    });

    // Mapping des composants optimisé avec useMemo
    const componentInfoMap = useMemo(() => ({
      "Browser": "Sound Browser",
      "Playlist": "Playlist",
      "Transport": "Transport",
      "ChannelRack": "Channel Rack",
    }), []);

    useEffect(() => {
      if (loadView) {
        const storedProjects = JSON.parse(localStorage.getItem("projects") || "{}");
        setProjectsList(storedProjects);
      }
    }, [loadView]);


    // Gestionnaires d'événements optimisés avec useCallback
    const handleMouseEnter = useCallback((componentName) => {
      setInfoOnMouseHover(componentInfoMap[componentName] || componentName);
    }, [componentInfoMap]);

    const handleMouseLeave = useCallback(() => {
      setInfoOnMouseHover("");
    }, []);

    const handleSubMouseEnter = useCallback((label) => {
      setInfoOnMouseHover(label);
    }, []);

    // Gestion optimisée des colonnes avec useCallback
    const handleColsChange = useCallback((newCols) => {
      const validCols = Math.max(4, Math.min(256, newCols)); // Limites sécurisées
      setCols(validCols);
      
      // Mise à jour optimisée de la playlist
      setPlaylist((prev) => ({
        ...prev,
        initGrid: Array.from({ length: rows }, (_, rowIdx) => 
          Array.from({ length: validCols }, (_, colIdx) => 
            colIdx < (prev.initGrid[rowIdx]?.length || 0)
              ? prev.initGrid[rowIdx][colIdx] 
              : null
          )
        )
      }));

      // Mise à jour des grilles de patterns existants
      setGrids(prevGrids => {
        const updatedGrids = {};
        Object.keys(prevGrids).forEach(instrument => {
          updatedGrids[instrument] = Array.from({ length: rows }, (_, rowIdx) =>
            Array.from({ length: validCols }, (_, colIdx) =>
              colIdx < (prevGrids[instrument][rowIdx]?.length || 0)
                ? prevGrids[instrument][rowIdx][colIdx]
                : false
            )
          );
        });
        return updatedGrids;
      });

      // Mise à jour des patterns avec les nouvelles dimensions
      setPatterns(prevPatterns => 
        prevPatterns.map(pattern => ({
          ...pattern,
          grids: Object.fromEntries(
            Object.entries(pattern.grids || {}).map(([instrument, grid]) => [
              instrument,
              Array.from({ length: rows }, (_, rowIdx) =>
                Array.from({ length: validCols }, (_, colIdx) =>
                  colIdx < (grid[rowIdx]?.length || 0) ? grid[rowIdx][colIdx] : false
                )
              )
            ])
          )
        }))
      );
    }, [rows]);

    // Gestionnaires d'événements optimisés
    const handleSamplesUpdated = useCallback((updatedPlayers) => {
      setPlayers(updatedPlayers);
    }, []);

    const handleChannelsUpdated = useCallback((updatedChannels) => {
      setPlayers(updatedChannels);
    }, []);

    const handleUrlUpdated = useCallback((updatedUrl) => {
      setChannelSources(updatedUrl);
    }, []);

    const handlePatternsUpdated = useCallback((updatedPatterns) => {
      setPatterns(updatedPatterns);
    }, []);



    // Gestion des patterns optimisée
    const handleSelectPattern = useCallback((newSelectedPattern) => {
      console.log("🧠 Sauvegarde du pattern actuel :", selectedPattern);
      
      setPatterns((prevPatterns) => {
        const updated = prevPatterns.map((pattern) =>
          pattern.id === selectedPattern.id
            ? { ...pattern, grids: grids }
            : pattern
        );
        return updated;
      });

      setSelectedPattern(newSelectedPattern);
      setGrids(newSelectedPattern.grids);
    }, [selectedPattern, grids]);



    const handleGridsUpdated = useCallback((updatedGrids) => {
      setGrids(updatedGrids);
      
      setPatterns((prevPatterns) =>
        prevPatterns.map((pattern) =>
          pattern.id === selectedPattern.id
            ? { ...pattern, grids: updatedGrids }
            : pattern
        )
      );
    }, [selectedPattern]);

    const handlePlacePattern = useCallback((row, col, pattern) => {
      setPlaylist((prev) => {
        const newGrid = [...prev.initGrid];
        newGrid[row][col] = pattern;
        return { ...prev, initGrid: newGrid };
      });
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
  }, [patterns, selectedPattern]);

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
        <GraphicEqIcon sx={{ position: "fixed", top: 0, left: 15, color: "white", fontSize: "45px", zIndex: 2 }} />
        
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
            setCols: handleColsChange, // Utilise la fonction optimisée
            onPlacePattern: handlePlacePattern,
            patterns,
            stepRow,      
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
              onColsChange={handleColsChange} // Transmission de la fonction optimisée
              cols={cols} // Transmission de la valeur actuelle
              rows={rows}
              isPlaying={isPlaying}
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