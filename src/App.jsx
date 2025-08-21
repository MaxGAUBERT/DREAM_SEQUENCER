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
import ChannelProvider from "./Contexts/ChannelProvider";
import { useHistoryContext } from "./Contexts/HistoryProvider";


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

  const {undo, redo} = useHistoryContext();

  // Mémoiser openComponents pour éviter les re-renders
  const [openComponents, setOpenComponents] = useState(() => ({
    "Drum Rack": true,
    "Pattern Selector": true,
    "Piano Roll": false,
    "Playlist": true,
    "FXChain": false
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
    setIsPianoRollOpen(true);
  }, []);

  const openModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  }, []);

  const handleSelectPattern = useCallback((id) => {
    setSelectedPatternID(id);
    console.log("Selected pattern",  id + 1);

    setInstrumentList(prev => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach(inst => {
        if (!updated[inst].grids) updated[inst].grids = {};
        if (!updated[inst].grids[id]) {
          updated[inst].grids[id] = Array(numSteps).fill(false);
        }
        if (!updated[inst].pianoData) updated[inst].pianoData = {};
        if (!updated[inst].pianoData[id]) {
          updated[inst].pianoData[id] = [];
        }
      });

      return updated;
    });
  }, [setSelectedPatternID, setInstrumentList]);

  useEffect(() => {
  setInstrumentList(prev => {
    if (!prev) return prev;
    const next = { ...prev };

    Object.values(next).forEach(inst => {
      if (!inst.grids) inst.grids = {};
      // assure qu'on a une grille pour le pattern courant
      if (!inst.grids[selectedPatternID]) {
        inst.grids[selectedPatternID] = Array(numSteps).fill(false);
      }

      const arr = inst.grids[selectedPatternID] || [];
      if (arr.length < numSteps) {
        inst.grids[selectedPatternID] = [
          ...arr,
          ...Array(numSteps - arr.length).fill(false),
        ];
      } else if (arr.length > numSteps) {
        inst.grids[selectedPatternID] = arr.slice(0, numSteps);
      }
    });

    return next;
  });
}, [numSteps, selectedPatternID, setInstrumentList]);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
    } else if (e.ctrlKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
    }
};

useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}, [undo, redo]); // ✅ Inclure les deux fonctions

  const actionHandlers = useMemo(() => ({
    "Drum Rack": () => setOpenComponents(prev => ({ ...prev, "Drum Rack": !prev["Drum Rack"] })),
    "Pattern Selector": () => setOpenComponents(prev => ({ ...prev, "Pattern Selector": !prev["Pattern Selector"] })),
    "Piano Roll": () => setOpenComponents(prev => ({ ...prev, "Piano Roll": !prev["Piano Roll"] })),
    "Playlist": () => setOpenComponents(prev => ({ ...prev, "Playlist": !prev["Playlist"] })),
    "FXChain": () => setOpenComponents(prev => ({ ...prev, "FXChain": !prev["FXChain"] })),
    "New Project": () => openModal("new"),
    "Load Project": () => openModal("load"),
    "Save As": () => openModal("saveAs"),
    "Save": saveCurrentProject,
    "Undo": undo,
    "Redo": redo,
  }), [openModal, saveCurrentProject, undo, redo]);

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
  <div className="w-full h-full absolute bg-gray-900 font-['Orbitron'] text-sm font-bold">
    <div className="z-0 pointer-events-none">
      <MdGraphicEq
        size={50}
        className="absolute z-0 pointer-events-none top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white opacity-0"
      />
    </div>

    {/* ====== Top bar ====== */}
    <GlobalColorContextProvider>
      <ChannelProvider>
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

        {/* ====== Workspace (grid) ====== */}
        <PlayContext>
          <main
            className="
              h-[calc(100vh-50px)]  /* ajuste si ta top bar est plus/moins haute */
              p-0 overflow-hidden
              grid gap-0
              grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_104px]
              xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_120px]
              2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)_136px]
            "
          >
            {/* ===== Colonne GAUCHE : DrumRack (haut) + PianoRoll (bas) ===== */}
            <section
              className="
                min-h-0 overflow-hidden
                grid gap-0
                grid-rows-[minmax(0,0.62fr)_minmax(0,0.38fr)]
                2xl:grid-rows-[minmax(0,0.65fr)_minmax(0,0.35fr)]
              "
            >
              <div className="min-h-0 overflow-hidden">
                {openComponents['Drum Rack'] && (
                  <div className="h-full w-full min-h-0 overflow-auto scrollbar-custom border border-white/15 rounded-xl bg-black/80 text-white p-2">
                    <DrumRack
                      numSteps={numSteps}
                      setNumSteps={setNumSteps}
                      patterns={patterns}
                      instrumentList={instrumentList}
                      setInstrumentList={setInstrumentList}
                      selectedPatternID={selectedPatternID}
                      channelModalOpen={channelModalOpen}
                      setChannelModalOpen={setChannelModalOpen}
                      instrumentName={instrumentName}
                      setInstrumentName={setInstrumentName}
                      onOpenPianoRoll={openPianoRollForInstrument}
                    />
                  </div>
                )}
              </div>

              <div className="min-h-0 overflow-hidden">
                {isPianoRollOpen && (
                  <div className="h-full w-full min-h-0 overflow-auto scrollbar-custom border border-white/15 rounded-xl bg-black text-white">
                    <PianoRoll
                      selectedPatternID={selectedPatternID}
                      selectedInstrument={pianoRollInstrument}
                      instrumentList={instrumentList}
                      setInstrumentList={setInstrumentList}
                      onOpen={setIsPianoRollOpen}
                      onClose={() => setIsPianoRollOpen(false)}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* ===== Colonne MILIEU : Playlist ===== */}
            <aside className="min-h-0 overflow-hidden">
              {openComponents['Playlist'] && (
                <div className="h-full w-full min-h-0 overflow-auto scrollbar-custom border border-white/15 rounded-xl bg-black/80 text-white">
                  <Playlist
                    selectedPatternID={selectedPatternID}
                    colorByIndex={getColorByIndex}
                    patterns={patterns}
                    instrumentList={instrumentList}
                    cells={cells}
                    setCells={setCells}
                    numSteps={numSteps}
                  />
                </div>
              )}
            </aside>

            {/* ===== Colonne DROITE : Pattern Selector (hauteur = entre menu strip et bas) ===== */}
            <aside className="min-h-0 overflow-hidden">
              {openComponents['Pattern Selector'] && (
                <div className="min-h-0 overflow-auto scrollbar-custom bg-[#101826]">
                  <PatternSelector
                    patterns={patterns}
                    setPatterns={setPatterns}
                    colorByIndex={getColorByIndex}
                    initLength={initLength}
                    onSelect={handleSelectPattern}
                    selectedPatternID={selectedPatternID}
                    setInstrumentList={setInstrumentList}
                  />
                </div>
              )}
            </aside>
          </main>

          {/* TransportBar occupe toute la largeur en bas */}
          <div className="col-span-3 border-t border-white/10">
            <TransportBar />
          </div>
        </PlayContext>
      </ChannelProvider>
    </GlobalColorContextProvider>
  </div>
);

}