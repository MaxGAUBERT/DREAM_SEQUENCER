import React, { useState, useMemo, useCallback, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { usePlayContext } from "../../Contexts/PlayContext";
import { usePatternStore, colorByIndex } from "../../store/usePatternStore";
import { usePlaylistStore } from "../../store/usePlaylistStore";
import { usePlaylistAudio } from "../../Hooks/Playlist/usePlaylistAudio";

// ── Cell mémoïsée ────────────────────────────────────────────────────────────

const Cell = React.memo(({ cell, index, onClick, isActive, size, patterns }) => {
  const patternId = cell != null ? cell - 1 : null;
  const pattern   = patternId != null ? patterns.find((p) => p.id === patternId) : null;
  const label     = pattern ? (pattern.name?.trim() || `P${patternId + 1}`) : null;
  const color     = patternId != null ? colorByIndex(patternId) : null;

  return (
    <button
      onClick={() => onClick(index)}
      className={`relative rounded-md transition-all duration-75 hover:ring-2 hover:ring-blue-400 focus:outline-none
        ${color ?? "bg-gray-800"}
        ${isActive ? "ring-2 ring-green-400" : ""}`}
      style={{ width: size, height: size * 0.6 }}
      aria-label={label ?? `Cellule ${index}`}
    >
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white pointer-events-none select-none">
          {label}
        </span>
      )}
    </button>
  );
});

// ── Composant principal ───────────────────────────────────────────────────────

const Playlist = ({ onClose }) => {
  const { isPlaying } = usePlayContext();

  const patterns         = usePatternStore((s) => s.patterns);
  const selectedPatternID = usePatternStore((s) => s.selectedPatternID);

  const cells      = usePlaylistStore((s) => s.cells);
  const width      = usePlaylistStore((s) => s.width);
  const height     = usePlaylistStore((s) => s.height);
  const CELL_SIZE  = usePlaylistStore((s) => s.CELL_SIZE);
  const { setWidth, setHeight, placePattern, clearCells } = usePlaylistStore();

  // Audio découplé
  const { activeColRef } = usePlaylistAudio();

  // Colonne active affichée — on poll avec rAF pour ne pas re-render sur chaque tick audio
  const [activeCol, setActiveCol] = useState(null);
  useEffect(() => {
    if (!isPlaying) { setActiveCol(null); return; }
    let rafId;
    const tick = () => { setActiveCol(activeColRef.current); rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const [isLoop, setIsLoop] = useState(true);

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `80px repeat(${width}, ${CELL_SIZE}px)`,
  }), [width, CELL_SIZE]);

  const handleCellClick = useCallback((index) => {
    placePattern(index, selectedPatternID);
  }, [selectedPatternID, placePattern]);

  return (
    <div className="h-full w-full bg-gray-900 rounded-xl p-3 text-white flex flex-col">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-3 bg-gray-800 p-3 rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={clearCells}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
            title="Vider la grille"
          >
            <MdDelete size={18} />
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isLoop}
              onChange={(e) => setIsLoop(e.target.checked)}
            />
            Loop
          </label>

          <label className="flex items-center gap-2 text-sm">
            Width
            <input
              type="range" min={5} max={100} value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-20"
            />
            <span>{width}</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            Height
            <input
              type="range" min={5} max={100} value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-20"
            />
            <span>{height}</span>
          </label>
        </div>

        <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">
          <IoClose size={18} />
        </button>
      </div>

      {/* ── Header colonnes ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-gray-900">
        <div className="grid" style={gridStyle}>
          <div />
          {Array.from({ length: width }, (_, col) => (
            <div
              key={col}
              className={`text-center text-xs font-semibold ${
                activeCol === col ? "text-green-400" : "text-gray-400"
              }`}
            >
              {col + 1}
            </div>
          ))}
        </div>
      </div>

      {/* ── Grille ───────────────────────────────────────────────────────────── */}
      <div className="overflow-auto flex-1 border border-gray-700 rounded-md">
        {Array.from({ length: height }, (_, row) => (
          <div key={row} className="grid items-center odd:bg-gray-700 even:bg-gray-850" style={gridStyle}>
            <div className="text-xs text-gray-300 pl-2">Track {row + 1}</div>

            {Array.from({ length: width }, (_, col) => {
              const index = row * width + col;
              return (
                <Cell
                  key={index}
                  index={index}
                  cell={cells[index] ?? null}
                  onClick={handleCellClick}
                  isActive={isPlaying && activeCol === col}
                  size={CELL_SIZE}
                  patterns={patterns}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(Playlist);