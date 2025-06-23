import {useState, useEffect, useCallback, useRef} from "react";
import { stringify, parse } from "flatted";
import StripMenu from "./UI/StripMenu";
import DrumRack from "./Components/DrumRack";
import PatternSelector from "./Components/PatternSelector";
import NewProjectModal from "./UI/Modals/NewProjectModal";
import LoadProjectModal from "./UI/Modals/LoadProjectModal";
import SaveAsProjectModal from "./UI/Modals/SaveAsProjectModal";
import {useProjectManager} from "./Hooks/useProjectManager";
import * as Tone from "tone";
import PlayContext, { usePlayContext } from "./Contexts/PlayContext";
import { MdGraphicEq } from "react-icons/md";
import GlobalColorContextProvider from "./Contexts/GlobalColorContext";
import TransportBar from "./Components/TransportBar";
import PianoRoll from "./Components/PianoRoll";

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
    DEFAULT_INSTRUMENTS,
    notes,
    setNotes,
    currentProjectId,
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
    loadProject,
    deleteProject,
    assignSampleToInstrument,
    selectedSoundId,
    setSelectedSoundId,
    deleteAllProjects
  } = useProjectManager();

  const [isPianoRollOpen, setIsPianoRollOpen] = useState(false);
  const [pianoRollInstrument, setPianoRollInstrument] = useState(null);

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

  const openPianoRollForInstrument = (instrumentName) => {
    setPianoRollInstrument(instrumentName);
    setIsPianoRollOpen(!isPianoRollOpen);
  };


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
              //checked: false,
              muted: false
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
      case "Piano Roll":
        setOpenComponents(prev => ({
          ...prev,
          "Piano Roll": !prev["Piano Roll"]
        }))
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

  const currentProjectName = projects.find(p => p.id === currentProjectId)?.name || "New Project";
  if (currentProjectName){
    console.log("Current project name:", currentProjectName);
  }




  return (
    <div className="min-h-screen h-screen bg-gray-900 font-['Orbitron'] text-sm font-bold relative">
     
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
          onDelete={deleteAllProjects}
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
            onOpenPianoRoll={openPianoRollForInstrument}
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

        {isPianoRollOpen && (
          <PianoRoll selectedInstrument={pianoRollInstrument} onOpen={setIsPianoRollOpen} onClose={() => setIsPianoRollOpen(false)}/>
        )}

        <TransportBar />
      </PlayContext>
      

      </GlobalColorContextProvider>
    </div>
 
  );
}


// modif: app, drum rack, ch modal, 