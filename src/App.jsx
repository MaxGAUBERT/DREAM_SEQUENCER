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
import FXChain from "./Components/FXChain";
import Split from "react-split";
import Settings from "./UI/Modals/Settings";


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

    {modals.save && (
      <SaveAsProjectModal 
        onClose={() => closeModal("saveCurrentProject")} 
        onSaveAs={saveAsProject} 
      />
    )}

    {modals.Settings && (
      <Settings open={modals.Settings} onClose={() => closeModal("Settings")} initialTab="general"/>
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
    deleteAllProjects, 
    openComponents,
    setOpenComponents, 
    DEFAULT_SAMPLES,
  } = useProjectManager();

  const [pianoRollInstrument, setPianoRollInstrument] = useState(null);
  const [instrumentName, setInstrumentName] = useState("");
  const [channelModalOpen, setChannelModalOpen] = useState(false);

  const {undo, redo} = useHistoryContext();

  const [modals, setModals] = useState(() => ({
    new: false,
    load: false,
    saveAs: false,
    Settings: false
  }));

  const openPianoRollForInstrument = useCallback((instrumentName) => {
    setPianoRollInstrument(instrumentName);
    setOpenComponents(prev => ({ ...prev, "Piano Roll": true }));
  }, []);

  const openModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  }, []);

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
}, [undo, redo]); 

  const actionHandlers = useMemo(() => ({
    "Drum Rack": () => setOpenComponents(prev => ({ ...prev, "Drum Rack": !prev["Drum Rack"] })),
    "Pattern Selector": () => setOpenComponents(prev => ({ ...prev, "Pattern Selector": !prev["Pattern Selector"] })),
    "Piano Roll": () => setOpenComponents(prev => ({ ...prev, "Piano Roll": !prev["Piano Roll"] })),
    "Playlist": () => setOpenComponents(prev => ({ ...prev, "Playlist": !prev["Playlist"] })),
    "FXChain": () => setOpenComponents(prev => ({ ...prev, "FXChain": !prev["FXChain"] })),
    "New Project": () => openModal("new"),
    "Load Project": () => openModal("load"),
    "Save As": () => openModal("saveAs"),
    "Save": !currentProject ? () => openModal("saveAs") : saveCurrentProject,
    "Undo": undo,
    "Redo": redo,
    "Settings": () => openModal("Settings"),
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
    <div className="w-full h-full absolute bg-gray-900 font-['Orbitron'] text-sm font-bold overflow-hidden">

      <div>
        <label className="fixed top-5 right-0 text-white-600">
        {currentProject ? `Project: ${currentProject.name}` : "No project loaded"}
      </label>
      </div>

      {/* ====== Top bar ====== */}
      <GlobalColorContextProvider>
        <ChannelProvider instrumentList={instrumentList} DEFAULT_SAMPLES={DEFAULT_SAMPLES}>
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
          <main className="h-[calc(100vh-50px)] p-0 overflow-hidden grid gap-0
              grid-cols-[minmax(0,0.7fr)_minmax(0,1.8fr)_104px]
              xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_120px]
              2xl:grid-cols-[minmax(0,1.90fr)_minmax(0,1.25fr)_85px]
            ">
              <section className="h-full min-h-0 min-w-0 overflow-hidden">
                {/* Split vertical DrumRack/PianoRoll */}

              {(openComponents['Drum Rack'] || openComponents['Piano Roll']) ? (
                <Split
                  direction="vertical"
                  sizes={[50, 50]}
                  minSize={[140, 180]}
                  gutterSize={5}
                  className="h-full min-h-0 flex flex-col"
                  gutter={() => {
                    const g = document.createElement('div');
                    g.className = 'gutter bg-white/10 hover:bg-white/25 cursor-row-resize';
                    return g;
                  }}
                  >
                    {/* Haut : DrumRack */}
                    <div className="min-h-0 min-w-0 border-2 overflow-hidden">
                      {openComponents['Drum Rack'] && (
                        <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl bg-gray-900">
                          <DrumRack
                            {...{ numSteps, setNumSteps, patterns, instrumentList, setInstrumentList,
                            selectedPatternID, channelModalOpen, setChannelModalOpen,
                            instrumentName, setInstrumentName }}
                            onOpenPianoRoll={openPianoRollForInstrument}
                            onClose={() => setOpenComponents(p => ({ ...p, 'Drum Rack': false }))}
                          />
                        </div>
                      )}
                    </div>

    {/* Bas : PianoRoll */}
    <div className="min-h-0 border-2 min-w-0">
      {openComponents['Piano Roll'] && (
      <div className="h-full w-full min-h-0 min-w-0 overflow-auto scrollbar-custom rounded-xl bg-gray-900">

          <PianoRoll
            {...{ selectedPatternID, instrumentList, setInstrumentList, numSteps, setNumSteps }}
            selectedInstrument={pianoRollInstrument}
            onOpen={() => setOpenComponents(p => ({ ...p, 'Piano Roll': true }))}
            onClose={() => setOpenComponents(p => ({ ...p, 'Piano Roll': false }))}
          />
        </div>
      )}
    </div>
  </Split>

            ) : null}
          </section>

          <aside className="h-full min-h-0 min-w-0 overflow-hidden">
          {openComponents['Playlist'] && openComponents['FXChain'] ? (
            <Split
              direction="vertical"
              sizes={[67, 33]}
              minSize={[265, 100]}
              gutterSize={5}
              className="h-full min-h-0 flex flex-col"
              gutter={() => {
                const g = document.createElement('div');
                g.className = 'gutter bg-white/10 hover:bg-white/25 cursor-row-resize';
                return g;
              }}
            >
              <div className="min-h-0 min-w-0 border-2 overflow-hidden">
                <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl bg-gray-900 scrollbar-custom">
                  <Playlist {...{ selectedPatternID, patterns, instrumentList, cells, setCells, numSteps }}
                    colorByIndex={getColorByIndex}
                    onClose={() => setOpenComponents(p => ({ ...p, "Playlist": false }))}
                  />
                </div>
              </div>

              <div className="min-h-0 min-w-0 border-2 overflow-hidden">
                <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl bg-gray-900 scrollbar-custom">
                  <FXChain
                    {...{ instrumentList, setInstrumentList }}
                    onClose={() => setOpenComponents(p => ({ ...p, "FXChain": false }))}
                  />
                </div>
              </div>
            </Split>
          ) : (
            <div className="h-full min-h-0 min-w-0 overflow-hidden">
              {openComponents['Playlist'] && (
               <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl ring-1 ring-white/10 bg-gray-900">
                  <Playlist {...{ selectedPatternID, patterns, instrumentList, cells, setCells, numSteps }}
                    colorByIndex={getColorByIndex}
                    onClose={() => setOpenComponents(p => ({ ...p, "Playlist": false }))}
                  />
                </div>
              )}
              {openComponents['FXChain'] && (
               <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl ring-1 ring-white/10 bg-gray-900">
                  <FXChain
                    {...{ instrumentList, setInstrumentList }}
                    onClose={() => setOpenComponents(p => ({ ...p, "FXChain": false }))}
                  />
                </div>
              )}
            </div>
          )}
        </aside>




          </main>

          {/* TransportBar occupe toute la largeur en bas */}
          <div className="col-span-3 border-t-2 border-gray/10">
            <TransportBar />
          </div>
          

          {openComponents['Pattern Selector'] && (
            <div>
            <PatternSelector
              patterns={patterns}
              setPatterns={setPatterns}
              colorByIndex={getColorByIndex}
              initLength={initLength}
              selectedPatternID={selectedPatternID}
              setInstrumentList={setInstrumentList}
              onSelect={setSelectedPatternID}
            />
          </div>
          )}
        </PlayContext>
      </ChannelProvider>
    </GlobalColorContextProvider>
  </div>
);
}