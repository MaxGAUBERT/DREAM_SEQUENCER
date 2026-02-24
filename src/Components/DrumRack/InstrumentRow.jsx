import React, { useMemo } from "react";
import { FiUpload } from "react-icons/fi";
import { MdPiano } from "react-icons/md";
import StepGrid from "./StepGrid";

const OVER_CLASSES =
  "outline outline-1 outline-transparent data-[over=true]:outline-blue-400 data-[over=true]:outline-2";

const InstrumentRow = ({
  name,
  data,
  selectedPatternID,
  numSteps,
  onToggleStep,
  onMute,
  onSlot,
  onDelete,
  onSelectSample,
  onOpenModal,
  onOpenPianoRoll,
}) => {
  // Normalise la grille une seule fois par changement de dépendances
  const grid = useMemo(() => {
    const raw = data.grids?.[selectedPatternID] ?? [];
    const result = [...raw];
    while (result.length < numSteps) result.push(false);
    return result.slice(0, numSteps);
  }, [data.grids, selectedPatternID, numSteps]);

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); e.currentTarget.dataset.over = "true"; };
  const handleDragLeave = (e) => { e.currentTarget.dataset.over = "false"; };
  const handleDrop      = (e) => {
    e.preventDefault();
    e.currentTarget.dataset.over = "false";
    const url     = e.dataTransfer.getData("audio/url");
    const display = e.dataTransfer.getData("audio/name");
    if (url) onSelectSample(name, url, display);
  };

  // ── Sample via input file ─────────────────────────────────────────────────
  const fileInputId = `file-${name}`;
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSelectSample(name, url, file.name);
    e.target.value = "";
  };

  return (
    <div className="flex items-center border-b border-gray-600">
      {/* ── En-tête canal ─────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-1 w-64 min-w-64 px-2 bg-gray-800 ${OVER_CLASSES}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-over="false"
        title="Déposer un sample ici"
      >
        {/* Upload fichier */}
        <input
          id={fileInputId}
          type="file"
          accept="audio/*"
          hidden
          onChange={handleFileChange}
        />
        <button onClick={() => document.getElementById(fileInputId).click()} title="Charger sample">
          <FiUpload size={16} />
        </button>

        {/* Mute */}
        <input
          type="checkbox"
          checked={data.muted}
          title="Mute / Unmute"
          onChange={(e) => onMute(name, e.target.checked)}
        />

        {/* Piano Roll */}
        <button onClick={() => onOpenPianoRoll(name)} title="Piano Roll">
          <MdPiano size={16} />
        </button>

        {/* Slot mixer */}
        <input
          type="number"
          title="Assigner au mixer"
          min={0}
          max={200}
          step={1}
          value={data.slot ?? 0}
          onChange={(e) => onSlot(name, Number(e.target.value))}
          className="w-10 h-6"
        />

        {/* Nom du canal / ouvrir modal */}
        <button
          onClick={() => onOpenModal(name)}
          onMouseDown={(e) => { if (e.button === 2) { e.preventDefault(); onDelete(name); } }}
          className="font-semibold hover:bg-gray-600 text-gray-300 truncate"
          title={`Éditer ${name} | Clic-droit : supprimer`}
        >
          {data.displayName ?? name}
        </button>
      </div>

      {/* ── Steps ─────────────────────────────────────────────────────────── */}
      <StepGrid
        name={name}
        grid={grid}
        onToggleStep={onToggleStep}
      />
    </div>
  );
};

export default React.memo(InstrumentRow);