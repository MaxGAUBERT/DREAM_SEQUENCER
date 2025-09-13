import React, { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { usePlayContext } from "../Contexts/PlayContext";
import { rowToNoteName } from "./Utils/noteUtils";
import * as Tone from "tone";
import { useProjectManager } from "../Hooks/useProjectManager";
import { useSampleContext } from "../Contexts/ChannelProvider";
import { IoClose } from "react-icons/io5";

function resizeCells(prevCells, oldWidth, oldHeight, newWidth, newHeight) {
  const newCells = Array(newWidth * newHeight).fill(null);
  const minRows = Math.min(oldHeight, newHeight);
  const minCols = Math.min(oldWidth, newWidth);

  for (let row = 0; row < minRows; row++) {
    for (let col = 0; col < minCols; col++) {
      const oldIndex = row * oldWidth + col;
      const newIndex = row * newWidth + col;
      if (
        oldIndex < prevCells.length &&
        prevCells[oldIndex] !== null &&
        prevCells[oldIndex] !== 0
      ) {
        newCells[newIndex] = prevCells[oldIndex];
      }
    }
  }

  return newCells;
}


const Playlist = ({selectedPatternID, colorByIndex, patterns, instrumentList, cells, setCells, numSteps, onClose}) => {
  const {isPlaying, playMode, bpm} = usePlayContext();
  const {width, setWidth, height, setHeight, CELL_SIZE} = useProjectManager();
  const {getSampler} = useSampleContext();
  const [isLoop, setIsLoop] = useState(true);

  const [prevDimensions, setPrevDimensions] = useState({width, height});
  const [currentColumn, setCurrentColumn] = useState(null);

  useEffect(() => {
  if (prevDimensions.width === width && prevDimensions.height === height) return;

  const oldWidth = prevDimensions.width;
  const oldHeight = prevDimensions.height;

  setCells(prevCells => {
    const resized = resizeCells(prevCells, oldWidth, oldHeight, width, height);
    return resized;
  });

  setPrevDimensions({ width, height });
}, [width, height]);

function playPattern(pattern, instrumentList, startTime, numSteps) {
  const stepDuration = Tone.Time("16n").toSeconds();

  Object.entries(instrumentList).forEach(([instrumentName, instrument]) => {
    const sampler = getSampler(instrumentName);
    if (!sampler || !sampler.loaded) {
      console.warn(`Sampler for ${instrumentName} not available or not loaded.`);
      return;
    }

    const rawSteps = instrument?.grids?.[pattern.id] || [];
    const paddedSteps = [...rawSteps];
    while (paddedSteps.length < numSteps) paddedSteps.push(false);

    for (let stepIndex = 0; stepIndex < numSteps; stepIndex++) {
      if (paddedSteps[stepIndex] && !instrumentList[instrumentName].muted) {
        const noteTime = startTime + stepIndex * stepDuration;
        sampler.triggerAttackRelease("C4", "4n", noteTime);
      }
    }

    // Piano roll
    const notes = instrument?.pianoData?.[pattern.id] || [];
    notes.forEach(note => {
      if (note) {
        const noteTime = startTime + note.start * stepDuration;
        const duration = Tone.Time(note.length * stepDuration * 2).toNotation();
        const velocity = note.velocity ?? 1;
        const noteName = rowToNoteName(note.row);
        sampler.triggerAttackRelease(noteName, duration, noteTime, velocity);
      }
    });
  });
}


  const handleWidthChange = (e) => {
  const newWidth = Number(e.target.value);
  console.log(`Changement de largeur: ${width} -> ${newWidth}`);

  setCells(prevCells => resizeCells(prevCells, width, height, newWidth, height));
  setWidth(newWidth);
};


  const handleHeightChange = (e) => {
  const newHeight = Number(e.target.value);
  console.log(`Changement de hauteur: ${height} -> ${newHeight}`);

  setCells(prevCells => resizeCells(prevCells, width, height, width, newHeight));
  setHeight(newHeight);
};

useEffect(() => {
  if (!isPlaying || playMode !== "Song" || !instrumentList) return;

  const cleanup = () => {
    if (Tone.Transport.state === "started") {
      Tone.Transport.stop();
    }
    Tone.Transport.cancel();
  };

  cleanup();

  Tone.Transport.bpm.value = bpm;

  const stepDuration = Tone.Time("16n").toSeconds(); 
  const patternDuration = stepDuration * numSteps;
  let currentColumn = 0;
  let repeatId;

  if (!isLoop) {
    for (let col = 0; col < width; col++) {
      Tone.Transport.schedule((time) => {
        setCurrentColumn(col);

        for (let row = 0; row < height; row++) {
          const index = row * width + col;
          const patternID = cells[index];
          if (patternID && patterns[patternID - 1]) {
            const pattern = patterns[patternID - 1];
            playPattern(pattern, instrumentList, time, numSteps);
          }
        }

        if (col === width - 1) {
          Tone.Transport.scheduleOnce(() => {
            Tone.Transport.stop();
            setCurrentColumn(0); 
          }, time + patternDuration);
        }
      }, col * patternDuration);

      currentColumn = (currentColumn + 1) % width;
    }
  }
  else {
    repeatId = Tone.Transport.scheduleRepeat((time) => {
    setCurrentColumn(currentColumn); 

    for (let row = 0; row < height; row++) {
      const index = row * width + currentColumn;
      const patternID = cells[index];
      if (patternID && patterns[patternID - 1]) {
        const pattern = patterns[patternID - 1];
        playPattern(pattern, instrumentList, time, numSteps);
      }
    }

    currentColumn = (currentColumn + 1) % width;
    console.log("Pattern duration:", patternDuration, "and numSteps: ", numSteps)
  }, patternDuration); 
 
  }

  Tone.Transport.start();

  return () => {
    cleanup();
    Tone.Transport.clear(repeatId);
  };
}, [isPlaying, playMode, bpm, instrumentList, cells, patterns, numSteps, isLoop]);


  const placePattern = (index) => {
    setCells(prev => {
      const newCells = [...prev];
      
      if (newCells[index] === selectedPatternID + 1) {
        newCells[index] = null;
        console.log("Pattern removed at index", index);
      } else {
        newCells[index] = selectedPatternID + 1;
        console.log("Pattern placed at index", index, "with:", selectedPatternID);
      }

      return newCells;
    });
  };

  return (
   <div
  className="
    border-2 border-white rounded-xl bg-gray-900 text-white
    p-2 min-h-0 h-full w-full
    overflow-auto scrollbar-custom
  "
  >
      <button
        onClick={onClose}
        title="Close Playlist"
        className="px-1 py-2 left-0 relative bg-gray-800 hover:bg-gray-700 rounded ml-4 transition-colors">

        <IoClose size={15} />
      </button>

    <div className="flex items-center gap-4 mb-4">
      <button
        onClick={() => setCells(Array(width * height).fill(null))}
        className="p-2 bg-red-500 text-white rounded"
      >
        <MdDelete size={15} />
      </button>

       <section className="flex items-center gap-4 p-2 mt-2">
      <input
        type="checkbox"
        checked={isLoop}
        onChange={(e) => setIsLoop(e.target.checked)}
        title="Enable loop mode"
      />
      <label>{isLoop ? "loop" : "one shot"}</label>
    </section>

      <div className="flex items-center gap-2">
        <label>Width ({width})</label>
        <input type="range" min={5} max={50} value={width} onChange={handleWidthChange} />
      </div>

      <div className="flex items-center gap-2">
        <label>Height ({height})</label>
        <input type="range" min={5} max={50} value={height} onChange={handleHeightChange} />
      </div>
    </div>
  

    {/* Zone grille */}
      <div
  style={{
    display: "grid",
    gridTemplateColumns: `auto repeat(${width}, ${CELL_SIZE}px)`, // 1 col label + steps
    gridTemplateRows: `auto repeat(${height}, ${CELL_SIZE / 2}px)`, // 1 ligne header + tracks
    gap: "3px",
    width: `calc(${width * CELL_SIZE}px + 80px)`,
    height: `calc(${height * (CELL_SIZE / 2)}px + 30px)`, // + place pour header
  }}
>
  <div></div>

  {/* === Header colonnes === */}
  {Array.from({ length: width }).map((_, col) => (
    <div
      key={`col-${col}`}
      className="text-gray-400 italic flex items-center justify-end pr-5"
      style={{
        fontSize: "0.9rem",
        whiteSpace: "nowrap",
      }}
    >
      {col + 1}
    </div>
  ))}

  {/* === Lignes avec labels Track + cells === */}
  {Array.from({ length: height }).map((_, row) => (
    <React.Fragment key={`row-${row}`}>
      {/* Label Track */}
      <div
        className="text-gray-300 italic flex items-center justify-end pr-2"
        style={{
          fontSize: "0.8rem",
          whiteSpace: "nowrap",
        }}
      >
        Track {row + 1}
      </div>

      {/* Cells */}
      {Array.from({ length: width }).map((_, col) => {
        const index = row * width + col;
        const cell = cells[index];
        return (
          <button
            key={index}
            onClick={() => placePattern(index)}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE / 2}px`,
              border: isPlaying && currentColumn === col ? "4px solid green" : "3px solid gray",
            }}
            className={`${
              cell !== null ? colorByIndex(cell - 1) : "bg-gray-800"
            } hover:bg-gray-700`} 
          >
            {cell ? patterns[cell - 1].name : null}
          </button>
        );
      })}
    </React.Fragment>
  ))}
      </div>

  </div>
);

};

export default React.memo(Playlist);