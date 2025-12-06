import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MdDelete } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import * as Tone from "tone";

import { usePlayContext } from "../Contexts/PlayContext";
import { rowToNoteName } from "./Utils/noteUtils";
import { useProjectManager } from "../Hooks/useProjectManager";
import { useSampleContext } from "../Contexts/ChannelProvider";

// ---------------- OPTIM PERFS HELPERS ----------------

function resizeCells(prevCells, oldWidth, oldHeight, newWidth, newHeight) {
  const newCells = Array(newWidth * newHeight).fill(null);
  const minRows = Math.min(oldHeight, newHeight);
  const minCols = Math.min(oldWidth, newWidth);

  for (let row = 0; row < minRows; row++) {
    for (let col = 0; col < minCols; col++) {
      const oldIndex = row * oldWidth + col;
      const newIndex = row * newWidth + col;
      if (prevCells[oldIndex] !== null) {
        newCells[newIndex] = prevCells[oldIndex];
      }
    }
  }

  return newCells;
}

// Cell memoized = énorme gain FPS
const Cell = React.memo(({ cell, index, onClick, isActive, color, size}) => {


  return (
    <button
      onClick={() => onClick(index)}
      className={`relative rounded-md transition-all duration-75 hover:ring-2 hover:ring-blue-400 focus:outline-none
        ${cell ? color : "bg-gray-800"}
        ${isActive ? "ring-2 ring-green-400" : ""}`}
      style={{
        width: size,
        height: size * 0.6
      }}
    >
     {cell&& (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white pointer-events-none select-none">
          {cell}
        </span>
      )}
    </button>
  );
});


const Playlist = ({
  selectedPatternID,
  colorByIndex,
  patterns,
  instrumentList,
  cells,
  setCells,
  numSteps,
  onClose
}) => {
  const { isPlaying, playMode, bpm } = usePlayContext();
  const { width, setWidth, height, setHeight, CELL_SIZE } = useProjectManager();
  const { getSampler } = useSampleContext();

  const [isLoop, setIsLoop] = useState(true);
  const [currentColumn, setCurrentColumn] = useState(null);
  const [prevDimensions, setPrevDimensions] = useState({ width, height });


  // Memo grid dimensions
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `80px repeat(${width}, ${CELL_SIZE}px)`
  }), [width, CELL_SIZE]);


  // ======= DIM RESIZE OPTIM =======
  useEffect(() => {
    if (prevDimensions.width === width && prevDimensions.height === height) return;

    setCells(prev => resizeCells(prev, prevDimensions.width, prevDimensions.height, width, height));
    setPrevDimensions({ width, height });
  }, [width, height]);

  // ======= HIGH PERF PATTERN PLAYER =======
  const playPattern = useCallback((pattern, startTime) => {
    const stepDuration = Tone.Time("16n").toSeconds();

    for (const [instrumentName, instrument] of Object.entries(instrumentList)) {
      const sampler = getSampler(instrumentName);
      if (!sampler || !sampler.loaded || instrument.muted) continue;

      const steps = instrument?.grids?.[pattern.id] || [];

      for (let i = 0; i < steps.length; i++) {
        if (steps[i]) {
          sampler.triggerAttackRelease("C4", "4n", startTime + i * stepDuration);
        }
      }

      const notes = instrument?.pianoData?.[pattern.id] || [];
      for (const note of notes) {
        if (!note) continue;
        const time = startTime + note.start * stepDuration;
        const duration = Tone.Time(note.length * stepDuration * 2).toNotation();
        sampler.triggerAttackRelease(
          rowToNoteName(note.row),
          duration,
          time,
          note.velocity ?? 1
        );
      }
    }
  }, [instrumentList]);

  // ======= TRANSPORT OPTIM =======
  useEffect(() => {
    if (!isPlaying || playMode !== "Song" || !instrumentList) return;

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    const stepDuration = Tone.Time("16n").toSeconds();
    const patternDuration = stepDuration * numSteps;
    let col = 0;

    const repeatId = Tone.Transport.scheduleRepeat((time) => {
      setCurrentColumn(col);

      for (let row = 0; row < height; row++) {
        const index = row * width + col;
        const patternID = cells[index];

        if (patternID && patterns[patternID - 1]) {
          playPattern(patterns[patternID - 1], time);
        }
      }

      col = (col + 1) % width;
    }, patternDuration);

    Tone.Transport.start();

    return () => {
      Tone.Transport.clear(repeatId);
      Tone.Transport.stop();
    };
  }, [isPlaying, playMode, bpm, cells, patterns, numSteps, width, height]);

  // Prevent re-creation on each render
  const placePattern = useCallback((index) => {
    setCells(prev => {
      const next = [...prev];
      next[index] = next[index] === selectedPatternID + 1 ? null : selectedPatternID + 1;
      return next;
    });
  }, [selectedPatternID]);

  return (
    <div className="h-full w-full bg-gray-900 rounded-xl p-3 text-white flex flex-col">

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-3 bg-gray-800 p-3 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCells(Array(width * height).fill(null))}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            <MdDelete size={18} />
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isLoop} onChange={(e) => setIsLoop(e.target.checked)} />
            Loop
          </label>
          <span className="text-sm">Width:</span>
          <input type="range" min={5} max={100} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-16 p-1 rounded-lg bg-gray-700 text-center" />
          <span className="text-sm">Height:</span>
          <input type="range" min={5} max={100} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-16 p-1 rounded-lg bg-gray-700 text-center" />

        </div>

        <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">
          <IoClose size={18} />
        </button>
      </div>

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-gray-900">
        <div className="grid" style={gridStyle}>
          <div />
          {Array.from({ length: width }).map((_, col) => (
            <div key={col} className="text-center text-xs text-gray-400 font-semibold">
              {col + 1}
            </div>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="overflow-auto flex-1 border border-gray-700 rounded-md">
        {Array.from({ length: height }).map((_, row) => (
          <div key={row} className="grid items-center odd:bg-gray-700 even:bg-gray-850" style={gridStyle}>
            <div className="text-xs text-gray-300 pl-2">Track {row + 1}</div>

            {Array.from({ length: width }).map((_, col) => {
              const index = row * width + col;
              const cell = cells[index];

              return (
                <Cell
                  key={index}
                  index={index}
                  cell={cell ? cell : null}
                  onClick={placePattern}
                  isActive={isPlaying && currentColumn === col}
                  color={cell ? colorByIndex(cell - 1) : null}
                  size={CELL_SIZE}
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
