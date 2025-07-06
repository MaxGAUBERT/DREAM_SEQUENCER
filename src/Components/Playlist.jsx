import { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { usePlayContext } from "../Contexts/PlayContext";
import * as Tone from "tone";

const WIDTH = 30; // nombre de colonnes
const HEIGHT = 30; // nombre de lignes
const CELL_SIZE = 50; // taille en pixels

const Playlist = ({selectedPatternID, patterns, instrumentList}) => {
  const [cells, setCells] = useState(Array(WIDTH * HEIGHT).fill(0));
  const {isPlaying, playMode, bpm} = usePlayContext();

  useEffect(() => {
  if (!isPlaying || playMode !== "Song") return;

  // Set tempo
  Tone.Transport.bpm.value = bpm;

  // Cancel previous scheduled events & reset Transport
  Tone.Transport.cancel();
  Tone.Transport.stop();

  // On va accumuler la durée pour enchaîner les patterns
  let timeline = 0;

  // Parcourir la grille playlist (rows × cols)
  for (let row = 0; row < HEIGHT; row++) {
    for (let col = 0; col < WIDTH; col++) {
      const index = row * WIDTH + col;
      const patternID = cells[index];

      if (patternID && patterns[patternID]) {
        const pattern = patterns[patternID - 1];

        // Ex: durée pattern = 1 mesure ("1m"), à ajuster selon ta config
        const patternDuration = Tone.Time("1m").toSeconds();

        // Programmer la lecture du pattern à timeline
        Tone.Transport.scheduleOnce((time) => {
          playPattern(pattern, instrumentList, time);
        }, timeline);

        timeline += patternDuration;
      }
    }
  }

  // Démarrer la lecture
  Tone.Transport.start();

  // Nettoyage à l'arrêt (optionnel)
  return () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  };

}, [isPlaying, playMode, bpm, cells, patterns, instrumentList]);


function playPattern(pattern, instrumentList, startTime) {
  // Pour chaque instrument concerné dans le pattern
  Object.entries(instrumentList).forEach(([instrumentName, instrument]) => {
    const samplerUrl = instrument?.sample?.urls?.C4;
    if (!samplerUrl) return; 

    const gridSteps = instrument?.grids?.[pattern.id] || [];

    gridSteps.forEach((stepActive, stepIndex) => {
      if (stepActive) {
        const stepDuration = Tone.Time("16n").toSeconds();
        const noteTime = startTime + stepIndex * stepDuration;
        instrument.sampler?.triggerAttackRelease("C4", "8n", noteTime);
      }
    });
     
    /*
    const noteData = instrument?.pianoData?.[pattern.id];
    noteData.forEach((note) => {
      const stepDuration = Tone.Time("16n").toSeconds();
      const noteTime = startTime + note.start * stepDuration;
      instrument.sampler?.triggerAttackRelease(note.name, note.length, noteTime);
    });
    */
    // De même, tu peux jouer les notes de pianoData si nécessaire
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

export default Playlist;
