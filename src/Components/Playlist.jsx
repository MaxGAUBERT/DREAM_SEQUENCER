import React, { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { usePlayContext } from "../Contexts/PlayContext";
import { rowToNoteName } from "./Utils/noteUtils";
import * as Tone from "tone";
import { useProjectManager } from "../Hooks/useProjectManager";
import { useSampleContext } from "../Contexts/ChannelProvider";

const Playlist = ({selectedPatternID, colorByIndex, patterns, instrumentList, cells, setCells, numSteps}) => {
  const {isPlaying, playMode, bpm} = usePlayContext();
  const {width, setWidth, height, setHeight, CELL_SIZE} = useProjectManager();
  const {getSampler} = useSampleContext();
  
  // SOLUTION 1: Stocker les dimensions précédentes
  const [prevDimensions, setPrevDimensions] = useState({width, height});
  const [currentColumn, setCurrentColumn] = useState(null);

  // Effect pour préserver les patterns lors du redimensionnement
  useEffect(() => {
    // Vérifier si les dimensions ont vraiment changé
    if (prevDimensions.width === width && prevDimensions.height === height) {
      return; // Pas de changement, ne rien faire
    }

    console.log(`Redimensionnement: ${prevDimensions.width}x${prevDimensions.height} -> ${width}x${height}`);

    setCells(prevCells => {
      const newSize = width * height;
      const newCells = Array(newSize).fill(null);
      
      // Utiliser les vraies dimensions précédentes
      const oldWidth = prevDimensions.width;
      const oldHeight = prevDimensions.height;
      
      // Déterminer la zone de chevauchement
      const minRows = Math.min(oldHeight, height);
      const minCols = Math.min(oldWidth, width);
      
      console.log(`Zone de préservation: ${minRows} lignes x ${minCols} colonnes`);
      
      // Copier les patterns qui rentrent dans les nouvelles dimensions
      let patternsPreserved = 10;
      
      for (let row = 0; row < minRows; row++) {
        for (let col = 0; col < minCols; col++) {
          const oldIndex = row * oldWidth + col;
          const newIndex = row * width + col;
          
          // Vérifier que l'ancien index est valide et contient un pattern
          if (oldIndex < prevCells.length && 
              prevCells[oldIndex] !== null && 
              prevCells[oldIndex] !== 0) {
            
            newCells[newIndex] = prevCells[oldIndex];
            patternsPreserved++;
            
            console.log(`Pattern préservé: ligne ${row}, col ${col}, pattern ${prevCells[oldIndex]}`);
          }
        }
      }
      
      console.log(`${patternsPreserved} patterns préservés sur ${newSize} cellules`);
      
      return newCells;
    });
    
    // Mettre à jour les dimensions précédentes
    setPrevDimensions({width, height});
    
  }, [width, height]);

  function playPattern(pattern, instrumentList, startTime, numSteps) {
  const stepDuration = Tone.Time("16n").toSeconds(); // à adapter selon ta grille

  Object.entries(instrumentList).forEach(([instrumentName, instrument]) => {
    const sampler = getSampler(instrumentName) || instrument?.sample?.url;
    if (!sampler) {
      console.warn(`No sample found for instrument: ${instrumentName}`);
      return;
    }
    if (!sampler.loaded) {
      console.warn(`Sampler for ${instrumentName} not loaded yet.`);
      return;
    }

    const rawSteps = instrument?.grids?.[pattern.id] || [];
    const paddedSteps = [...rawSteps];
    while (paddedSteps.length < numSteps) paddedSteps.push(false);

    // Jouer les steps binaires (drums / samples)
    for (let stepIndex = 0; stepIndex < numSteps; stepIndex++) {
      if (paddedSteps[stepIndex]) {
        const noteTime = startTime + stepIndex * stepDuration;
        sampler.triggerAttackRelease("C4", "4n", noteTime);
      }
    }

    // Jouer les notes piano roll (polyphonie / pitch / durée)
    const notes = instrument?.pianoData?.[pattern.id] || [];
    notes.forEach(note => {
      if (note) {
        const noteTime = startTime + note.start * stepDuration;
        const duration = Tone.Time(note.length * stepDuration).toNotation();
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
    
    setCells(prevCells => {
      const newCells = Array(newWidth * height).fill(null);
      
      // Copier les patterns existants
      const minCols = Math.min(width, newWidth);
      let patternsPreserved = 0;
      
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < minCols; col++) {
          const oldIndex = row * width + col;
          const newIndex = row * newWidth + col;
          
          if (oldIndex < prevCells.length && 
              prevCells[oldIndex] !== null && 
              prevCells[oldIndex] !== 0) {
            
            newCells[newIndex] = prevCells[oldIndex];
            patternsPreserved++;
          }
        }
      }
      
      console.log(`Largeur: ${patternsPreserved} patterns préservés`);
      return newCells;
    });
    
    setWidth(newWidth);
  };

  const handleHeightChange = (e) => {
    const newHeight = Number(e.target.value);
    console.log(`Changement de hauteur: ${height} -> ${newHeight}`);
    
    setCells(prevCells => {
      const newCells = Array(width * newHeight).fill(null);
      
      // Copier les patterns existants
      const minRows = Math.min(height, newHeight);
      let patternsPreserved = 0;
      
      for (let row = 0; row < minRows; row++) {
        for (let col = 0; col < width; col++) {
          const oldIndex = row * width + col;
          const newIndex = row * width + col;
          
          if (oldIndex < prevCells.length && 
              prevCells[oldIndex] !== null && 
              prevCells[oldIndex] !== 0) {
            
            newCells[newIndex] = prevCells[oldIndex];
            patternsPreserved++;
          }
        }
      }
      
      console.log(`Hauteur: ${patternsPreserved} patterns préservés`);
      return newCells;
    });
    
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
  let currentTime = 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col;
      const patternID = cells[index];

      if (patternID && patterns[patternID - 1]) {
        const pattern = patterns[patternID - 1];
        const patternDuration = stepDuration * numSteps;

        Tone.Transport.scheduleOnce((time) => {
          playPattern(pattern, instrumentList, time, numSteps);
          setCurrentColumn(col);
        }, col * patternDuration);

        currentTime += patternDuration;
      }
    }
  }

  Tone.Transport.start();

  return cleanup;
}, [isPlaying, playMode, bpm, instrumentList, cells, patterns, numSteps]);



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
      className="gap-5 border-2 min-w-100 min-h-140 max-w-232.5 w-232.5 max-h-100 resize bg-gray-800 overflow-auto absolute top-[50px]"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${height}, ${CELL_SIZE}px)`,
        gap: "3px",
        width: `${width * CELL_SIZE}px`,
        height: `${height * CELL_SIZE}px`,
      }}
    >
    <label className="absolute top-[5px] left-[300px] text-white">
      {isPlaying && currentColumn !== null ? `Col: ${currentColumn + 1} / ${width}` : "Stopped"}
    </label>


      <button 
        onClick={() => setCells(Array(width * height).fill(null))}
        style={{
          width: `${CELL_SIZE + 5}px`,
          height: `${CELL_SIZE}px`,
          border: "2px solid #ccc",
          backgroundColor: "red"
        }}
      >
        <MdDelete size={20}/>
      </button>

      <div className="absolute flex flex-col top-[0px] ml-15 left-[10px]">
        <label>Width ({width})</label>
        <input
          type="range"
          min={5}
          max={50}
          value={width}
          onChange={handleWidthChange} 
        />
        <label>Height ({height})</label>
        <input
          type="range"
          min={5}
          max={50}
          value={height}
          onChange={handleHeightChange} 
        />
      </div>

      <div
        className="mt-15 bg-gray-800 relative top-[50px] left-[10px]"
        style={{
          gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${height}, ${CELL_SIZE}px)`,
          gap: "3px",
          width: `${width * CELL_SIZE}px`,
          height: `${height * CELL_SIZE}px`,
        }}
      >

        {currentColumn !== null && (
        <div
          className="absolute top-0 bg-red-400 bg-opacity-30 pointer-events-none z-10 transition-all duration-100"
          style={{
            left: `${currentColumn * CELL_SIZE}px`,
            width: `${CELL_SIZE / 10}px`,
            height: `${height * CELL_SIZE}px`,
          }}
        />
      )}

        {cells.map((cell, index) => (
          <button
            key={index}
            onClick={() => placePattern(index)}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              border: "1px solid #ccc",
            }}
            className={`${cell !== null ? colorByIndex(cell - 1) : "bg-gray-800"}`}
          >
            {cell ? cell : null}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(Playlist);