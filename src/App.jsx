import {useState, useEffect, useCallback, useRef} from "react";
import { stringify, parse } from "flatted";
import StripMenu from "./UI/StripMenu";
import SoundBrowser from "./Components/SoundBrowser";
import DrumRack from "./Components/DrumRack";
import PatternSelector from "./Components/PatternSelector";
import NewProjectModal from "./UI/Modals/NewProjectModal";
import LoadProjectModal from "./UI/Modals/LoadProjectModal";
import SaveAsProjectModal from "./UI/Modals/SaveAsProjectModal";
import {useProjectManager} from "./Hooks/useProjectManager";
import * as Tone from "tone";
import PlayContext from "./Contexts/PlayContext";
import { MdGraphicEq } from "react-icons/md";
import GlobalColorContextProvider from "./Contexts/GlobalColorContext";

function getColorByIndex(i) {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-pink-500", "bg-purple-500", "bg-orange-500", "bg-teal-500",
  ];
  return colors[i % colors.length];
}

export default function App() {
  const {
    projects,
    instrumentList,
    setInstrumentList,
    initializeInstrumentList,
    currentProject,
    initLength,
    INITIAL_PATTERN_ID,
    patterns,
    setPatterns,
    numSteps,
    setNumSteps,
    selectedPatternID,
    setSelectedPatternID,
    createProject,
    saveCurrentProject,
    saveAsProject,
    loadProject
  } = useProjectManager();

  const [openComponents, setOpenComponents] = useState({
    "Drum Rack": true,
    "Pattern Selector": true,
    "Sound Browser": false
  });
  const [instrumentName, setInstrumentName] = useState("");

  const [channelModalOpen, setChannelModalOpen] = useState(false);

  const [modals, setModals] = useState({
    new: false,
    load: false,
    saveAs: false,
  });

  // Sauvegarder l'état complet dans localStorage
  useEffect(() => {
  if (currentProject && Object.keys(instrumentList).length > 0) {
      localStorage.setItem(
        `project_${currentProject.id}_instruments`, 
        stringify(instrumentList)
      );
    }
  }, [instrumentList, currentProject]);

  // Charger l'état complet depuis localStorage lors du chargement d'un projet
  useEffect(() => {
    if (currentProject) {
      const saved = localStorage.getItem(`project_${currentProject.id}_instruments`);
      if (saved) {
        try {
          const parsed = parse(saved);
          setInstrumentList(parsed);
        } catch (e) {
          console.error(`Erreur de parsing pour le projet ${currentProject.id}:`, e);
          setInstrumentList(initializeInstrumentList());
        }
      } else {
        // Nouveau projet : initialiser avec les patterns existants
        const newInstrumentList = Object.fromEntries(
          DEFAULT_INSTRUMENTS.map(inst => [
            inst,
            {
              grids: Object.fromEntries(
                patterns.map(pattern => [pattern.id, Array(16).fill(false)])
              ),
              value: null,
              checked: false
            }
          ])
        );
        setInstrumentList(newInstrumentList);
      }
    }
  }, [currentProject, patterns, initializeInstrumentList]);

  const openModal = (name) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  };

  const closeModal = (name) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  };

  // Simplifier la sélection de pattern - pas besoin de charger depuis localStorage
  const handleSelectPattern = (id) => {
    //if (id == null) return;
    
    setSelectedPatternID(id);
    console.log("Selected pattern:", selectedPatternID);
    
    // S'assurer que les grilles existent pour ce pattern
    setInstrumentList(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(inst => {
        if (!updated[inst].grids) {
          updated[inst].grids = {};
        }
        if (!updated[inst].grids[id]) {
          updated[inst].grids[id] = Array(16).fill(false);
        }
      });
      return updated;
    });
  };

  const handleRunAction = useCallback((action) => {
    switch (action) {
      case "Drum Rack":
        setOpenComponents(prev => ({
          ...prev,
          "Drum Rack": !prev["Drum Rack"]
        }));
        break;
      case "Sound Browser":
        setOpenComponents(prev => ({
          ...prev,
          "Sound Browser": !prev["Sound Browser"]
        }));
        break;
      case "Pattern Selector":
        setOpenComponents(prev => ({
          ...prev,
          "Pattern Selector": !prev["Pattern Selector"]
        }));
        break;
      case "New Project":
        openModal("new");
        break;
      case "Load Project":
        openModal("load");
        break;
      case "Save As":
        openModal("saveAs");
        break;
      case "Save":
        saveCurrentProject();
        break;
      default:
        break;
    }
  }, [openComponents, modals, saveCurrentProject]);

  const currentProjectName = currentProject ? currentProject.name : "Untitled";

  return (
    <div className="w-full h-screen bg-gray-900 font-['Orbitron'] text-sm font-bold relative">
      <MdGraphicEq size={300} className="absolute top-2/4 left-2/4 transform -translate-x-1/2 -translate-y-1/2 text-white"/>
      <span className="absolute top-2 right-2 text-white">
        <h3>
           Dream Sequencer: {currentProjectName}
        </h3>  
      </span>
      <GlobalColorContextProvider>
      
      <StripMenu onAction={handleRunAction} />
      
      {modals.new && (
        <NewProjectModal 
          onClose={() => closeModal("new")} 
          onCreate={createProject} 
        />
      )}
      
      {modals.load && (
        <LoadProjectModal 
          savedProjects={projects} 
          onClose={() => closeModal("load")}
          onLoad={loadProject}
        />
      )}
      
      {modals.saveAs && (
        <SaveAsProjectModal 
          onClose={() => closeModal("saveAs")} 
          onSaveAs={saveAsProject} 
        />
      )}
      <PlayContext>
        {openComponents["Drum Rack"] && (
          <DrumRack 
            numSteps={numSteps} 
            setNumSteps={setNumSteps} 
            instrumentList={instrumentList} 
            setInstrumentList={setInstrumentList}
            selectedPatternID={selectedPatternID}
            channelModalOpen={channelModalOpen}
            setChannelModalOpen={setChannelModalOpen}
            instrumentName={instrumentName}
            setInstrumentName={setInstrumentName}
          />
        )}

        {openComponents["Pattern Selector"] && (
          <PatternSelector 
            patterns={patterns} 
            setPatterns={setPatterns} 
            colorByIndex={getColorByIndex} 
            initLength={initLength} 
            onSelect={handleSelectPattern} 
            selectedPatternID={selectedPatternID}
            setInstrumentList={setInstrumentList}
          />
        )}
      </PlayContext>
      
      {openComponents["Sound Browser"] && <SoundBrowser />}

      </GlobalColorContextProvider>
    </div>
  );
}