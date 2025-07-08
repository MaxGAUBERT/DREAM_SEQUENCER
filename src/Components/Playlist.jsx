import React, { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { usePlayContext } from "../Contexts/PlayContext";
import { rowToNoteName } from "./Utils/noteUtils";
import * as Tone from "tone";
import { useProjectManager } from "../Hooks/useProjectManager";

const Playlist = ({selectedPatternID, patterns, instrumentList, cells, setCells}) => {
  const {isPlaying, setIsPlaying, playMode, bpm} = usePlayContext();
  const {WIDTH, HEIGHT, CELL_SIZE} = useProjectManager();

  useEffect(() => {
  // Nettoyage systématique

  // Ne rien faire si on ne joue pas ou si on n'est pas en mode Song
  if (!isPlaying || playMode !== "Song" || !instrumentList) return;

  const cleanup = () => {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
    }
    Tone.Transport.cancel();
  };

  cleanup();

  Tone.Transport.bpm.value = bpm;

  let timeline = 0;

  for (let row = 0; row < HEIGHT; row++) {
    for (let col = 0; col < WIDTH; col++) {
      const index = row * WIDTH + col;
      const patternID = cells[index];

      if (patternID && patterns[patternID]) {
        const pattern = patterns[patternID - 1];
        const patternDuration = Tone.Time("1m").toSeconds();

        Tone.Transport.scheduleOnce((time) => {
          playPattern(pattern, instrumentList, time);
        }, timeline);

        timeline += patternDuration;
      }
    }
  }

  Tone.Transport.start();

  return cleanup;

}, [isPlaying, playMode, bpm, cells, patterns, instrumentList]);


function playPattern(pattern, instrumentList, startTime) {
  Object.entries(instrumentList).forEach(([instrumentName, instrument]) => {
    // CORRECTION : Accès au sample via la bonne propriété
    const samplerUrl = instrument?.sampleUrl || instrument?.sample?.url;
    if (!samplerUrl) {
      console.log(`No sample URL found for instrument: ${instrumentName}`);
      return; 
    }

    // Vérifier que le sampler existe
    if (!instrument.sampler || !instrument.sampler.loaded) {
      console.warn(`Sampler for ${instrumentName} is not loaded yet or missing.`);
      return;
    }


    const gridSteps = instrument?.grids?.[pattern.id] || [];
    const notes = instrument?.pianoData?.[pattern.id] || [];

    gridSteps.forEach((stepActive, stepIndex) => {
      if (stepActive && gridSteps) {
        const stepDuration = Tone.Time("16n").toSeconds();
        const noteTime = startTime + stepIndex * stepDuration;
        instrument.sampler?.triggerAttackRelease("C4", "8n", noteTime);
      }
    });

    notes.forEach((note) => {
  if (note && instrument?.sampler) {
    const stepDuration = Tone.Time("16n").toSeconds();
    const noteTime = startTime + note.start * stepDuration;
    const duration = Tone.Time(note.length * stepDuration).toNotation();
    const velocity = note.velocity ?? 1;
    const noteName = rowToNoteName(note.row);

    instrument.sampler.triggerAttackRelease(noteName, duration, noteTime, velocity);
  }
});


    

  });
}

const placePattern = (index) => {
  setCells(prev => {
    const newCells = [...prev];
    
    // Si la case contient déjà le pattern sélectionné, on l'efface
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
      className="grid z-25 border-2 pt-15 border-white resize bg-gray-800 overflow-auto w-300 max-w-1/2 max-h-120 absolute top-20"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${WIDTH}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${HEIGHT}, ${CELL_SIZE}px)`,
        gap: "3px",
      }}
    >
      <div className="absolute top-0 text-center">
        <button 
          onClick={() => setCells(Array(WIDTH * HEIGHT).fill(0))}
          style={{
            width: `${CELL_SIZE + 5}px`,
            height: `${CELL_SIZE}px`,
            border: "2px solid #ccc",
            backgroundColor: "red"
          }}
        >
          <MdDelete size={20}/>
        </button>
      </div>
      {cells.map((cell, index) => (
      <button
        key={index}
        onClick={() => placePattern(index)}
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          border: "1px solid #ccc",
          backgroundColor: cell ? '#aad' : '#fff',
        }}
      >
        {cell ? `P${cell}` : ''}
      </button>
    ))}
    </div>
    );
};

export default React.memo(Playlist); 