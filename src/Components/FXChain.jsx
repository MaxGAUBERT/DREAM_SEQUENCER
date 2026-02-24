// components/FXChain/FXChain.jsx
// Plus de props instrumentList/setInstrumentList.
// Les nœuds Tone.js sont dans useFXAudio (refs), jamais dans le state.
import React, { useCallback, useMemo } from "react";
import { IoClose } from "react-icons/io5";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";
import { useDrumRackStore }      from "../store/useDrumRackStore";
import { useFXStore, FX_NAMES, SLOTS } from "../store/useFXStore";
import { useFXAudio }            from "../Hooks/FXChain/useFXAudio";

// ── Slot card ─────────────────────────────────────────────────────────────────

const FXSlot = React.memo(({
  slotNumber,
  assignedChannel,
  isSelected,
  currentFX,
  currentVolume,
  onSlotClick,
  onFXChange,
  onVolumeChange,
}) => {
  const isMaster   = slotNumber === 0;
  const isOccupied = Boolean(assignedChannel);

  return (
    <div
      onClick={() => onSlotClick(slotNumber, assignedChannel)}
      className={`flex flex-col p-2 rounded shadow-md w-[120px] transition-all duration-150 border-2 cursor-pointer
        ${isOccupied ? "bg-green-700 border-green-500" : "bg-gray-800 border-gray-600"}
        ${isSelected  ? "border-blue-400" : ""}
      `}
    >
      {/* Label canal */}
      <label className="text-sm mb-1 font-semibold truncate">
        {isMaster ? "" : (assignedChannel ?? "—")}
      </label>

      {/* Label slot */}
      <p className="text-sm mb-2 font-semibold text-gray-300">
        {isMaster ? "Master" : `Insert ${slotNumber}`}
      </p>

      {/* Sélecteur FX */}
      <select
        className="w-full bg-gray-900 text-white text-sm p-1 rounded mb-2"
        disabled={!isOccupied}
        value={currentFX ?? ""}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onFXChange(assignedChannel, e.target.value || null)}
      >
        <option value="">— Aucun effet —</option>
        {FX_NAMES.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {/* Fader volume */}
      <input
        type="range"
        min={0}
        max={50}
        value={currentVolume ?? 0}
        disabled={!isOccupied}
        className="h-50 w-[200px] rotate-[-90deg] mt-4"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onVolumeChange(assignedChannel, Number(e.target.value))}
        aria-label={`Volume ${assignedChannel ?? "slot"}`}
      />
    </div>
  );
});

// ── Composant principal ───────────────────────────────────────────────────────

const FXChain = ({ onClose }) => {
  const { colorsComponent } = useGlobalColorContext();

  // Stores
  const instrumentList  = useDrumRackStore((s) => s.instrumentList);
  const { selectedSlot, channelFX, channelVolume, setSelectedSlot, setChannelFX, setChannelVolume } = useFXStore();

  // Audio (nœuds Tone.js dans des refs)
  const { applyFX, setVolume } = useFXAudio();

  // Résout quel canal est assigné à un slot donné
  const getChannelAtSlot = useCallback((slotNumber) => {
    const entry = Object.entries(instrumentList).find(
      ([, data]) => Number(data.slot) === Number(slotNumber)
    );
    return entry?.[0] ?? null;
  }, [instrumentList]);

  // Map slot → canal (mémoïsée pour éviter de recalculer dans chaque FXSlot)
  const slotToChannel = useMemo(() => {
    const map = new Map();
    SLOTS.forEach((s) => map.set(s, getChannelAtSlot(s)));
    return map;
  }, [getChannelAtSlot]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSlotClick = useCallback((slotNumber, channel) => {
    setSelectedSlot({ channel: channel ?? null, slot: slotNumber });
  }, [setSelectedSlot]);

  const handleFXChange = useCallback((instrumentName, fxName) => {
    if (!instrumentName) return;
    setChannelFX(instrumentName, fxName);   // store UI
    applyFX(instrumentName, fxName);         // nœuds Tone.js
  }, [setChannelFX, applyFX]);

  const handleVolumeChange = useCallback((instrumentName, value) => {
    if (!instrumentName) return;
    setChannelVolume(instrumentName, value); // store UI
    setVolume(instrumentName, value);        // nœud Tone.js
  }, [setChannelVolume, setVolume]);

  const selectedChannelLabel =
    slotToChannel.get(selectedSlot.slot) ?? "All Channels";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full h-full overflow-auto scrollbar-custom flex flex-col gap-4 shadow-lg"
      style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.Background }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-gray-800 px-3 py-2">
        <button
          onClick={onClose}
          className="bg-gray-700 hover:bg-gray-600 rounded p-1 transition-colors"
          title="Fermer FX Chain"
        >
          <IoClose size={15} />
        </button>
        <span className="text-sm font-semibold truncate">{selectedChannelLabel}</span>
      </div>

      {/* Slots */}
      <div className="flex flex-row gap-4 px-3 pb-4">
        {SLOTS.map((s) => {
          const assignedChannel = slotToChannel.get(s);
          return (
            <FXSlot
              key={s}
              slotNumber={s}
              assignedChannel={assignedChannel}
              isSelected={selectedSlot.slot === s}
              currentFX={assignedChannel ? channelFX[assignedChannel] : null}
              currentVolume={assignedChannel ? channelVolume[assignedChannel] : 0}
              onSlotClick={handleSlotClick}
              onFXChange={handleFXChange}
              onVolumeChange={handleVolumeChange}
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(FXChain);