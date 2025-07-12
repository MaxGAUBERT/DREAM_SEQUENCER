import React, { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { usePlayContext } from "../Contexts/PlayContext";
import { rowToNoteName } from "./Utils/noteUtils";
import * as Tone from "tone";
import { useProjectManager } from "../Hooks/useProjectManager";
import { useSampleContext } from "../Contexts/SampleProvider";

const Playlist = ({selectedPatternID, colorByIndex, patterns, instrumentList, cells, setCells}) => {
  const {isPlaying, playMode, bpm} = usePlayContext();
  const {width, setWidth, height, setHeight, CELL_SIZE} = useProjectManager();
  const {getSampler} = useSampleContext();
  
  // SOLUTION 1: Stocker les dimensions précédentes
  const [prevDimensions, setPrevDimensions] = useState({width, height});

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

  function playPattern(pattern, instrumentList, startTime) {
  Object.entries(instrumentList).forEach(([instrumentName, instrument]) => {
    const samplerUrl = getSampler(instrumentName) || instrument?.sample?.url;
    if (!samplerUrl) {
      console.log(`No sample URL found for instrument: ${instrumentName}`);
      return; 
    }

    // Vérifier que le sampler existe
    if (!samplerUrl || !samplerUrl.loaded) {
      console.warn(`Sampler for ${instrumentName} is not loaded yet or missing.`);
      return;
    }


    const gridSteps = instrument?.grids?.[pattern.id] || [];
    const notes = instrument?.pianoData?.[pattern.id] || [];

    gridSteps.forEach((stepActive, stepIndex) => {
      if (stepActive && gridSteps) {
        const stepDuration = Tone.Time("16n").toSeconds();
        const noteTime = startTime + stepIndex * stepDuration;
        samplerUrl?.triggerAttackRelease("C4", "8n", noteTime);
      }
    });

    notes.forEach((note) => {
  if (note && samplerUrl) {
    const stepDuration = Tone.Time("16n").toSeconds();
    const noteTime = startTime + note.start * stepDuration;
    const duration = Tone.Time(note.length * stepDuration).toNotation();
    const velocity = note.velocity ?? 1;
    const noteName = rowToNoteName(note.row);

    samplerUrl?.triggerAttackRelease(noteName, duration, noteTime, velocity);
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

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col;
      const patternID = cells[index];

      if (patternID && patterns[patternID]) {
        const pattern = patterns[patternID - 1];
        const patternDuration = Tone.Time("1m").toSeconds();

        Tone.Transport.scheduleOnce((time) => {
          playPattern(pattern, instrumentList, time);
        }, col * patternDuration);

        timeline += patternDuration;
      }
    }
  }

  Tone.Transport.start();

  return cleanup;

}, [isPlaying, playMode, bpm, instrumentList]);

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
        {cells.map((cell, index) => (
          <button
            key={index}
            onClick={() => placePattern(index)}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              border: "1px solid #ccc",
            }}
            className={`${cell !== null ? colorByIndex(cell - 1) : "bg-gray-400"}`}
          >
            {cell ? cell : null}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(Playlist);