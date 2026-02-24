import { useState, useEffect, useCallback, useMemo } from "react";
import Split from "react-split";

// ── UI ────────────────────────────────────────────────────────────────────────
import StripMenu         from "./UI/StripMenu";
import NewProjectModal   from "./UI/Modals/NewProjectModal";
import LoadProjectModal  from "./UI/Modals/LoadProjectModal";
import SaveAsProjectModal from "./UI/Modals/SaveAsProjectModal";
import Settings          from "./UI/Modals/Settings";

// ── Composants ────────────────────────────────────────────────────────────────
import DrumRack         from "./Components/DrumRack/DrumRack";
import PatternSelector  from "./Components/PatternSelector/PatternSelector";
import PianoRoll        from "./Components/PianoRoll/PianoRoll";
import Playlist         from "./Components/Playlist/Playlist";
import FXChain          from "./Components/FXChain";
import TransportBar     from "./Components/TransportBar";

// ── Contexts / Providers ──────────────────────────────────────────────────────
import PlayContext              from "./Contexts/PlayContext";
import GlobalColorContextProvider from "./Contexts/GlobalColorContext";
import ChannelProvider          from "./Contexts/ChannelProvider";
import { useHistoryContext }    from "./Contexts/HistoryProvider";

// ── Stores ────────────────────────────────────────────────────────────────────
import { usePatternStore }  from "./store/usePatternStore";
import { useDrumRackStore } from "./store/useDrumRackStore";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useProjectStorage } from "./Hooks/Storage/useProjectStorage";

// ── Helpers ───────────────────────────────────────────────────────────────────
const createGutter = () => {
  const g = document.createElement("div");
  g.className = "gutter bg-white/10 hover:bg-white/25 cursor-row-resize";
  return g;
};

// ─────────────────────────────────────────────────────────────────────────────
// ModalManager
// ─────────────────────────────────────────────────────────────────────────────
const ModalManager = ({ modals, projects, closeModal, createProject, loadProject, deleteAllProjects, saveAsProject }) => (
  <>
    {modals.new && (
      <NewProjectModal onClose={() => closeModal("new")} onCreate={createProject} />
    )}
    {modals.load && (
      <LoadProjectModal
        savedProjects={projects}
        onClose={() => closeModal("load")}
        onLoad={loadProject}
        onDelete={deleteAllProjects}
      />
    )}
    {(modals.saveAs || modals.save) && (
      <SaveAsProjectModal
        onClose={() => { closeModal("saveAs"); closeModal("save"); }}
        onSaveAs={saveAsProject}
      />
    )}
    {modals.Settings && (
      <Settings open onClose={() => closeModal("Settings")} initialTab="general" />
    )}
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const {
    projects, currentProject,
    createProject, saveCurrentProject, saveAsProject, loadProject, deleteAllProjects,
    openComponents, setOpenComponents,
    DEFAULT_SAMPLES,
  } = useProjectStorage();

  // Stores — App lit uniquement ce dont il a besoin pour ses propres décisions
  const instrumentList = useDrumRackStore((s) => s.instrumentList);
  const selectedPatternID = usePatternStore((s) => s.selectedPatternID);

  const [pianoRollInstrument, setPianoRollInstrument] = useState(null);
  const { undo, redo } = useHistoryContext();

  const [modals, setModals] = useState({
    new: false, load: false, saveAs: false, save: false, Settings: false,
  });

  // ── Raccourcis clavier ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.ctrlKey) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // ── Callbacks stables ───────────────────────────────────────────────────────
  const openModal = useCallback((name) => setModals((p) => ({ ...p, [name]: true })),  []);
  const closeModal = useCallback((name) => setModals((p) => ({ ...p, [name]: false })), []);

  const openPianoRollForInstrument = useCallback((name) => {
    setPianoRollInstrument(name);
    setOpenComponents((p) => ({ ...p, "Piano Roll": true }));
  }, [setOpenComponents]);

  const toggle = useCallback((key) =>
    setOpenComponents((p) => ({ ...p, [key]: !p[key] })),
  [setOpenComponents]);

  const actionHandlers = useMemo(() => ({
    "Drum Rack":        () => toggle("Drum Rack"),
    "Pattern Selector": () => toggle("Pattern Selector"),
    "Piano Roll":       () => toggle("Piano Roll"),
    "Playlist":         () => toggle("Playlist"),
    "FXChain":          () => toggle("FXChain"),
    "New Project":      () => openModal("new"),
    "Load Project":     () => openModal("load"),
    "Save As":          () => openModal("saveAs"),
    "Save":             !currentProject ? () => openModal("saveAs") : saveCurrentProject,
    "Undo":             undo,
    "Redo":             redo,
    "Settings":         () => openModal("Settings"),
  }), [toggle, openModal, saveCurrentProject, currentProject, undo, redo]);

  const handleRunAction = useCallback((action) => actionHandlers[action]?.(), [actionHandlers]);

  // ── Vues ouvertes ───────────────────────────────────────────────────────────
  const showDrumRack  = openComponents["Drum Rack"];
  const showPianoRoll = openComponents["Piano Roll"];
  const showPlaylist  = openComponents["Playlist"];
  const showFXChain   = openComponents["FXChain"];
  const showPatternSelector = openComponents["Pattern Selector"];
  const showLeft = showDrumRack || showPianoRoll;
  const showBothRight = showPlaylist && showFXChain;

  return (
    <div className="w-full h-full absolute bg-gray-900 font-['Orbitron'] text-sm font-bold overflow-hidden">

      {/* Nom du projet */}
      <label className="fixed top-5 right-0 text-white-600 z-50">
        {currentProject ? `Project: ${currentProject.name}` : "No project loaded"}
      </label>

      <GlobalColorContextProvider>
        <ChannelProvider instrumentList={instrumentList} DEFAULT_SAMPLES={DEFAULT_SAMPLES}>
          <StripMenu onAction={handleRunAction} />

          <ModalManager {...{ modals, projects, closeModal, createProject, loadProject, deleteAllProjects, saveAsProject }} />

          <PlayContext>
            <main className="h-[calc(100vh-50px)] p-0 overflow-hidden grid gap-0
              grid-cols-[minmax(0,0.7fr)_minmax(0,1.8fr)_104px]
              xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_120px]
              2xl:grid-cols-[minmax(0,1.90fr)_minmax(0,1.25fr)_85px]
            ">

              {/* ── Colonne gauche : DrumRack / PianoRoll ── */}
              <section className="h-full min-h-0 min-w-0 overflow-hidden">
                {showLeft ? (
                  <Split
                    direction="vertical"
                    sizes={[50, 50]}
                    minSize={[140, 180]}
                    gutterSize={5}
                    className="h-full min-h-0 flex flex-col"
                    gutter={createGutter}
                  >
                    <div className="min-h-0 min-w-0 border-2 overflow-hidden">
                      {showDrumRack && (
                        <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl bg-gray-900">
                          <DrumRack
                            onOpenPianoRoll={openPianoRollForInstrument}
                            onClose={() => toggle("Drum Rack")}
                          />
                        </div>
                      )}
                    </div>
                    <div className="min-h-0 border-2 min-w-0">
                      {showPianoRoll && (
                        <div className="h-full w-full min-h-0 min-w-0 overflow-auto scrollbar-custom rounded-xl bg-gray-900">
                          <PianoRoll
                            onClose={() => toggle("Piano Roll")}
                          />
                        </div>
                      )}
                    </div>
                  </Split>
                ) : null}
              </section>

              {/* ── Colonne centrale : Playlist / FXChain ── */}
              <aside className="h-full min-h-0 min-w-0 overflow-hidden">
                {showBothRight ? (
                  <Split
                    direction="vertical"
                    sizes={[67, 33]}
                    minSize={[265, 100]}
                    gutterSize={5}
                    className="h-full min-h-0 flex flex-col"
                    gutter={createGutter}
                  >
                    <div className="min-h-0 min-w-0 border-2 overflow-hidden">
                      <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl bg-gray-900 scrollbar-custom">
                        <Playlist onClose={() => toggle("Playlist")} />
                      </div>
                    </div>
                    <div className="min-h-0 min-w-0 border-2 overflow-hidden">
                      <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl bg-gray-900 scrollbar-custom">
                        <FXChain onClose={() => toggle("FXChain")} />
                      </div>
                    </div>
                  </Split>
                ) : (
                  <div className="h-full min-h-0 min-w-0 overflow-hidden">
                    {showPlaylist && (
                      <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl ring-1 ring-white/10 bg-gray-900">
                        <Playlist onClose={() => toggle("Playlist")} />
                      </div>
                    )}
                    {showFXChain && (
                      <div className="h-full w-full min-h-0 min-w-0 overflow-hidden rounded-xl ring-1 ring-white/10 bg-gray-900">
                        <FXChain onClose={() => toggle("FXChain")} />
                      </div>
                    )}
                  </div>
                )}
              </aside>

            </main>

            {/* ── Transport ── */}
            <div className="col-span-3 border-t-2 border-gray/10">
              <TransportBar />
            </div>

            {/* ── Pattern Selector (overlay) ── */}
            {showPatternSelector && (
              <PatternSelector />
            )}

          </PlayContext>
        </ChannelProvider>
      </GlobalColorContextProvider>
    </div>
  );
}