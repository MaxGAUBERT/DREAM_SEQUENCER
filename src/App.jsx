import {useState, useEffect, useCallback, useMemo} from "react";
import { stringify, parse } from "flatted";
import StripMenu from "./UI/StripMenu";
import DrumRack from "./Components/DrumRack/DrumRack";
import PatternSelector from "./Components/PatternSelector/PatternSelector";
import NewProjectModal from "./UI/Modals/NewProjectModal";
import LoadProjectModal from "./UI/Modals/LoadProjectModal";
import SaveAsProjectModal from "./UI/Modals/SaveAsProjectModal";
import {useProjectManager} from "./Hooks/useProjectManager";
import PlayContext from "./Contexts/PlayContext";
import { MdGraphicEq } from "react-icons/md";
import GlobalColorContextProvider from "./Contexts/GlobalColorContext";
import TransportBar from "./Components/TransportBar";
import PianoRoll from "./Components/PianoRoll/PianoRoll";
import Playlist from "./Components/Playlist";
import SampleProvider from "./Contexts/SampleProvider";


const getColorByIndex = (() => {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-pink-500", "bg-purple-500", "bg-orange-500", "bg-teal-500",
  ];
  
  return (i) => colors[i % colors.length];
})();


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
    cells, setCells,
    currentProjectId,
    currentProject,
    initLength,
    patterns,
    setPatterns,
    selectedPatternID,
    setSelectedPatternID,
    createProject,
    saveCurrentProject,
    saveAsProject,
    loadProject,
    numSteps,
    setNumSteps,
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

  const currentProjectName = useMemo(() => 
    projects.find(p => p.id === currentProjectId)?.name || "New Project",
    [projects, currentProjectId]
  );

  const openPianoRollForInstrument = useCallback((instrumentName) => {
    setPianoRollInstrument(instrumentName);
    setIsPianoRollOpen(!isPianoRollOpen);
  }, []);

  const openModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  }, []);

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

  useEffect(() => {
    if (currentProject && Object.keys(instrumentList).length > 0) {
      const debounceTimer = setTimeout(() => {
        localStorage.setItem(
          `project_${currentProject.id}_instruments`, 
          stringify(instrumentList)
        );
      }, 300); 

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
      const newInstrumentList = Object.fromEntries(
        DEFAULT_INSTRUMENTS.map(inst => [
          inst,
          {
            grids: Object.fromEntries(
              patterns.map(pattern => [pattern.id, Array(16).fill(false)])
            ),
            pianoData: {},
            value: null,
            muted: false,
            slot: 0
          }
        ])
      );
      setInstrumentList(newInstrumentList);
    }
  }, [currentProject, setInstrumentList]);

  return (
    <div className="min-h-screen h-screen bg-gray-900 font-['Orbitron'] text-sm font-bold relative">
      <MdGraphicEq size={300} className="absolute top-2/4 left-2/4 transform -translate-x-1/2 -translate-y-1/2 text-white"/>
      <span className="absolute top-2 right-2 text-white">
        <h3>Dream Sequencer: {currentProjectName}</h3>  
      </span>
     
      <GlobalColorContextProvider>
        <SampleProvider>
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
              selectedPatternID={selectedPatternID}
              colorByIndex={getColorByIndex}
              patterns={patterns}
              instrumentList={instrumentList}
              cells={cells}
              setCells={setCells}
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
        </SampleProvider>
      </GlobalColorContextProvider>
    </div>
  );
}