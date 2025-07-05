import {useState, useEffect, useCallback, useMemo} from "react";
import { stringify, parse } from "flatted";
import StripMenu from "./UI/StripMenu";
import DrumRack from "./Components/DrumRack";
import PatternSelector from "./Components/PatternSelector";
import NewProjectModal from "./UI/Modals/NewProjectModal";
import LoadProjectModal from "./UI/Modals/LoadProjectModal";
import SaveAsProjectModal from "./UI/Modals/SaveAsProjectModal";
import {useProjectManager} from "./Hooks/useProjectManager";
import PlayContext from "./Contexts/PlayContext";
import { MdGraphicEq } from "react-icons/md";
import GlobalColorContextProvider from "./Contexts/GlobalColorContext";
import TransportBar from "./Components/TransportBar";
import PianoRoll from "./Components/PianoRoll";
import Playlist from "./Components/Playlist";

// Mémoiser la fonction getColorByIndex
const getColorByIndex = (() => {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-pink-500", "bg-purple-500", "bg-orange-500", "bg-teal-500",
  ];
  
  return (i) => colors[i % colors.length];
})();

// Composant optimisé pour les modales
const ModalManager = ({
  modals,
  projects,
  closeModal,
  createProject,
  loadProject,
  deleteAllProjects,
  saveAsProject
}) => (
  <>
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
  </>
);

export default function App() {
  const {
    projects,
    instrumentList,
    setInstrumentList,
    initializeInstrumentList,
    DEFAULT_INSTRUMENTS,
    currentProjectId,
    currentProject,
    initLength,
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
    deleteAllProjects
  } = useProjectManager();

  const [isPianoRollOpen, setIsPianoRollOpen] = useState(false);
  const [pianoRollInstrument, setPianoRollInstrument] = useState(null);
  const [instrumentName, setInstrumentName] = useState("");
  const [channelModalOpen, setChannelModalOpen] = useState(false);

  // Mémoiser openComponents pour éviter les re-renders
  const [openComponents, setOpenComponents] = useState(() => ({
    "Drum Rack": true,
    "Pattern Selector": true,
    "Sound Browser": false,
    "Piano Roll": false,
    "Playlist": false
  }));

  const [modals, setModals] = useState(() => ({
    new: false,
    load: false,
    saveAs: false,
  }));

  // Mémoiser le nom du projet actuel
  const currentProjectName = useMemo(() => 
    projects.find(p => p.id === currentProjectId)?.name || "New Project",
    [projects, currentProjectId]
  );

  // Optimiser la fonction openPianoRoll
  const openPianoRollForInstrument = useCallback((instrumentName) => {
    setPianoRollInstrument(instrumentName);
    setIsPianoRollOpen(prev => !prev);
  }, []);

  // Optimiser les callbacks des modales
  const openModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  }, []);

  // Optimiser handleSelectPattern
  const handleSelectPattern = useCallback((id) => {
    setSelectedPatternID(id);

    setInstrumentList(prev => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach(inst => {
        if (!updated[inst].grids) updated[inst].grids = {};
        if (!updated[inst].grids[id]) {
          updated[inst].grids[id] = Array(16).fill(false);
        }
        if (!updated[inst].pianoData) updated[inst].pianoData = {};
        if (!updated[inst].pianoData[id]) {
          updated[inst].pianoData[id] = [];
        }
      });

      return updated;
    });
  }, [setSelectedPatternID, setInstrumentList]);

  // Optimiser handleRunAction avec useMemo pour les actions statiques
  const actionHandlers = useMemo(() => ({
    "Drum Rack": () => setOpenComponents(prev => ({ ...prev, "Drum Rack": !prev["Drum Rack"] })),
    "Sound Browser": () => setOpenComponents(prev => ({ ...prev, "Sound Browser": !prev["Sound Browser"] })),
    "Pattern Selector": () => setOpenComponents(prev => ({ ...prev, "Pattern Selector": !prev["Pattern Selector"] })),
    "Piano Roll": () => setOpenComponents(prev => ({ ...prev, "Piano Roll": !prev["Piano Roll"] })),
    "Playlist": () => setOpenComponents(prev => ({ ...prev, "Playlist": !prev["Playlist"] })),
    "New Project": () => openModal("new"),
    "Load Project": () => openModal("load"),
    "Save As": () => openModal("saveAs"),
    "Save": saveCurrentProject,
  }), [openModal, saveCurrentProject]);

  const handleRunAction = useCallback((action) => {
    const handler = actionHandlers[action];
    if (handler) {
      handler();
    }
  }, [actionHandlers]);

  // Optimiser les effets avec des dépendances précises
  useEffect(() => {
    if (currentProject && Object.keys(instrumentList).length > 0) {
      const debounceTimer = setTimeout(() => {
        localStorage.setItem(
          `project_${currentProject.id}_instruments`, 
          stringify(instrumentList)
        );
      }, 300); // Debounce pour éviter trop de sauvegardes

      return () => clearTimeout(debounceTimer);
    }
  }, [instrumentList, currentProject]);

  useEffect(() => {
    if (!currentProject) return;

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
            piano: {},
            value: null,
            muted: false,
            slot: 0
          }
        ])
      );
      setInstrumentList(newInstrumentList);
    }
  }, [currentProject, patterns, initializeInstrumentList, DEFAULT_INSTRUMENTS, setInstrumentList]);

  return (
    <div className="min-h-screen h-screen bg-gray-900 font-['Orbitron'] text-sm font-bold relative">
      <MdGraphicEq size={300} className="absolute top-2/4 left-2/4 transform -translate-x-1/2 -translate-y-1/2 text-white"/>
      <span className="absolute top-2 right-2 text-white">
        <h3>Dream Sequencer: {currentProjectName}</h3>  
      </span>
     
      <GlobalColorContextProvider>
        <StripMenu onAction={handleRunAction} />
        
        <ModalManager 
          modals={modals}
          projects={projects}
          closeModal={closeModal}
          createProject={createProject}
          loadProject={loadProject}
          deleteAllProjects={deleteAllProjects}
          saveAsProject={saveAsProject}
        />

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

          {openComponents["Playlist"] && (
            <Playlist 
              onSelectPattern={handleSelectPattern}
              selectedPatternID={selectedPatternID}
            />
          )}

          {isPianoRollOpen && (
            <PianoRoll 
              selectedPatternID={selectedPatternID} 
              selectedInstrument={pianoRollInstrument} 
              instrumentList={instrumentList} 
              setInstrumentList={setInstrumentList} 
              onOpen={setIsPianoRollOpen} 
              onClose={() => setIsPianoRollOpen(false)}
            />
          )}

          <TransportBar />
        </PlayContext>
      </GlobalColorContextProvider>
    </div>
  );
}