// components/DrumRack/DrumRack.jsx
import React from "react";
import { IoClose } from "react-icons/io5";
import { useGlobalColorContext } from "../../Contexts/GlobalColorContext";
import { useDrumRackStore } from "../../store/useDrumRackStore";
import { usePatternStore }  from "../../store/usePatternStore";
import { useDrumRackAudio } from "../../Hooks/DrumRack/useDrumRackAudio";
import InstrumentList from "./InstrumentList";
import DrumRackControls from "./DrumRackControls";
import InstrumentInput from "./InstrumentInput";
import MiniBrowser from "./MiniBrowser";
import ChannelModal from "../../UI/Modals/ChannelModal";

const DrumRack = ({ onOpenPianoRoll, onClose }) => {
  const { colorsComponent } = useGlobalColorContext();

  // ── Stores ────────────────────────────────────────────────────────────────
  const selectedPatternID = usePatternStore((s) => s.selectedPatternID);
  const currentPattern    = usePatternStore((s) => s.patterns.find((p) => p.id === s.selectedPatternID));

  const numSteps         = useDrumRackStore((s) => s.numSteps);
  const instrumentList   = useDrumRackStore((s) => s.instrumentList);
  const channelModalOpen = useDrumRackStore((s) => s.channelModalOpen);
  const activeInstrument = useDrumRackStore((s) => s.activeInstrumentName);
  const showAddInput     = useDrumRackStore((s) => s.showAddInput);

  const {
    setNumSteps, clearPattern, addInstrument, deleteAllInstruments,
    selectSample, renameInstrument, openChannelModal, closeChannelModal,
    toggleAddInput, hideAddInput, resetInstruments,
  } = useDrumRackStore();

  // ── Audio découplé ────────────────────────────────────────────────────────
  useDrumRackAudio(selectedPatternID);

  return (
    <div
      className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden rounded-xl ring-1 ring-white/15 bg-gray-900"
      style={{ backgroundColor: colorsComponent.Background, color: colorsComponent.Text }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-gray-800/80 backdrop-blur px-3 py-2">
        <span className="text-xs">
          Pattern : {currentPattern?.name} | Canaux : {Object.keys(instrumentList).length} | Steps : {numSteps}
        </span>
        <button
          className="px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          onClick={onClose}
          title="Fermer le Drum Rack"
        >
          <IoClose size={15} />
        </button>
      </div>

      {/* ── Zone scrollable ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom px-2 py-2">
        <InstrumentList
          instrumentList={instrumentList}
          selectedPatternID={selectedPatternID}
          numSteps={numSteps}
          onOpenChannelModal={openChannelModal}
          onOpenPianoRoll={onOpenPianoRoll}
          onSelectSample={selectSample}
        />

        <div className="mt-3">
          <DrumRackControls
            numSteps={numSteps}
            onSetNumSteps={setNumSteps}
            onClear={() => clearPattern(selectedPatternID)}
            onReset={() => resetInstruments({})}
            onDeleteAll={deleteAllInstruments}
            onAddToggle={toggleAddInput}
          />
        </div>

        <div className="mt-3">
          <MiniBrowser />
        </div>

        {showAddInput && (
          <div className="mt-3">
            <InstrumentInput
              onConfirm={addInstrument}
              onCancel={hideAddInput}
            />
          </div>
        )}
      </div>

      {/* ── Modal canal ─────────────────────────────────────────────────────── */}
      {channelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <ChannelModal
            onClose={closeChannelModal}
            instrumentName={activeInstrument}
            onRename={(newName) => renameInstrument(activeInstrument, newName)}
            onSelectSample={selectSample}
            onOpenPianoRoll={onOpenPianoRoll}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(DrumRack);