import React, {useRef, useEffect, useState, useMemo, useCallback} from "react";
import { Box, Button, Typography} from "@mui/material";
import * as ReactIcons from "react-icons/md";
import * as Tone from "tone";
import PianoMenu from "../FrontEnd/PianoMenu";
import { useCursorManager } from "../Contexts/CursorManager";
import { IoMove } from "react-icons/io5";
import { PiPaintBrushHousehold } from "react-icons/pi";
import PianoRollRow from "./PianoRollRow";


// Génère une liste de notes ascendantes (C3 → B5) en fonction du nombre de lignes
const generateNoteList = (num) => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const result = [];
  let octave = 3;
  let noteIndex = 0;
  for (let i = 0; i < num; i++) {
    result.push(notes[noteIndex] + octave);
    noteIndex++;
    if (noteIndex >= notes.length) {
      noteIndex = 0;
      octave++;
    }
  }
  return result;
};

const isBlackKey = (note) => note.includes("#");

const PianoRoll = React.memo(({
  grid,
  onGridToggle,
  rows,
  cols,
  onColsChange,
  onClearGrid,
  onCopy,
  onPaste,
  selectedInstrument,
  isPlaying
}) => {
const noteList = useMemo(() => generateNoteList(rows).reverse(), [rows]);
const { cursor, setCursor } = useCursorManager();
const [movingNote, setMovingNote] = useState(null); // { fromRow, fromCol }
const [isPainting, setIsPainting] = useState(false);
const [mode, setMode] = useState("draw");
const drawMode = mode === "draw";
const paintMode = mode === "paint";
const moveMode = mode === "move";
const [isMouseDown, setIsMouseDown] = useState(false);





// Empêcher le comportement par défaut du navigateur lors du maintien du clic
useEffect(() => {
  const preventDefaultDrag = (e) => {
    if (paintMode) {
      e.preventDefault();
      return false;
    }
  };

  document.addEventListener('dragstart', preventDefaultDrag);
  document.addEventListener('selectstart', preventDefaultDrag);
  
  return () => {
    document.removeEventListener('dragstart', preventDefaultDrag);
    document.removeEventListener('selectstart', preventDefaultDrag);
  };
}, [paintMode]);

// Ajouter un mousedown global pour gérer la peinture
useEffect(() => {
  const handleGlobalMouseUp = () => {
    setIsPainting(false);
    setMovingNote(null);
  };

  // Ajouter l'écouteur pour détecter quand le bouton est relâché, même en dehors du composant
  document.addEventListener('mouseup', handleGlobalMouseUp);
  
  return () => {
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };
}, []);
 
const playNote = useCallback((note) => {
  const synth = new Tone.Synth().toDestination();
  synth.triggerAttackRelease(note, "8n");
},[]);

const selectMode = useCallback((newMode) => {
  setMode(newMode);      // "draw", "paint" ou "move"
  setMovingNote(null);   // reset note en déplacement si besoin
  setIsPainting(false);  // reset peinture active
}, []);

const handleMouseDown = useCallback((row, col) => {
  setIsMouseDown(!isMouseDown);

  if (mode === "move" && grid[row][col]) {
    setMovingNote({ fromRow: row, fromCol: col, moved: false });
  } else if (mode === "draw") {
    onGridToggle(row, col);
  } else if (mode === "paint") {
    setIsPainting(true);
    if (!grid[row][col]) {
      onGridToggle(row, col);
    }
  }
}, [mode]);

const handleMouseEnter = useCallback((row, col) => {
  if (!isMouseDown) return;

  if (mode === "paint" && isPainting) {
    if (!grid[row][col]) {
      onGridToggle(row, col);
    }
  }

  if (mode === "move" && movingNote) {
    const { fromRow, fromCol, moved } = movingNote;

    if (row === fromRow && col === fromCol) return;

    if (!moved) {
      onGridToggle(fromRow, fromCol); // supprime l’ancienne
    }

    if (!grid[row][col]) {
      onGridToggle(row, col); // pose nouvelle
      setMovingNote({ fromRow: row, fromCol: col, moved: true });
    }
  }
}, [isMouseDown, mode, isPainting, grid, onGridToggle, movingNote]);

const handleMouseUp = useCallback(() => {
  setIsMouseDown(false);
  setIsPainting(false);
  setMovingNote(null);
}, []);

useEffect(() => {
  const handleUp = () => handleMouseUp();
  window.addEventListener("mouseup", handleUp);
  return () => window.removeEventListener("mouseup", handleUp);
}, [handleMouseUp]);


const handleMouseLeave = () => {
  // Pour les cas où la souris quitte le composant sans mouseup
  setIsPainting(false);
};


return (
    <Box
      sx={{
        display: "flex",
        position: "fixed",
        top: "56%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        bgcolor: "#111",
        border: "6px inset #fff",
        borderRadius: 2,
        width: "60%",
        height: "80%",
        overflow: "auto",
        p: 2,
        cursor: cursor,
        // Désactiver la sélection de texte dans tout le piano roll
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none"
      }}
      // Empêcher le comportement par défaut du navigateur lors du drag
      onDragStart={(e) => e.preventDefault()}
    >
      <Typography variant="h6" gutterBottom sx={{ position: "fixed", top: 10, right: 15, justifyContent: "right", display: "flex", width: "100%", color: "#fff" }}>
        Piano Roll - {selectedInstrument}
      </Typography>
      {/* Controls */}
      <Box sx={{ position: "absolute", top: 10, left: 20, display: "flex", gap: 2 }}>
        <PianoMenu onCut={onClearGrid} onCopy={onCopy} onPaste={onPaste}/>
        <Button
          onClick={() => selectMode("draw")}
          sx={{ fontSize: 12, bgcolor: drawMode ? "#444" : "transparent", color: "#fff", fontFamily: "monospace" }}
        >
          <ReactIcons.MdDraw size={20} />
        </Button>

        <Button
          onClick={() => selectMode("paint")}
          sx={{ fontSize: 12, bgcolor: paintMode ? "#444" : "transparent", color: "#fff", fontFamily: "monospace" }}
        >
          <PiPaintBrushHousehold size={20} />
        </Button>

        <Button
          onClick={() => selectMode("move")}
          sx={{ fontSize: 12, bgcolor: moveMode ? "#444" : "transparent", color: "#fff", fontFamily: "monospace" }}
        >
          <IoMove size={20} />
        </Button>

      </Box>

      {/* Grille complète avec piano intégré */}
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", mt: 4 }}>
        {/* Step headers */}
        <Box sx={{ display: "flex", flexDirection: "row", ml: 8.8 }}>
          {Array.from({ length: cols }, (_, idx) => (
            <Box
              key={idx}
              sx={{
                width: 30,
                height: 20,
                color: "white",
                fontSize: "0.5rem",
                fontFamily: "initial",
                fontWeight: "bold",
                textAlign: "center",
                borderBottom: "1px solid #555",
                bgcolor: idx % 4 === 0 ? "#333" : "transparent"
              }}
            >
              {idx + 1}
            </Box>
          ))}
        </Box>

        {/* Grid rows with integrated piano keys */}
        {noteList.map((note, rowIdx) => (
        <PianoRollRow
          key={rowIdx}
          note={note}
          rowIdx={rowIdx}
          rowData={grid[rowIdx]}
          playNote={playNote}
          handleMouseDown={handleMouseDown}
          handleMouseEnter={handleMouseEnter}
          handleMouseUp={handleMouseUp}
          handleMouseLeave={handleMouseLeave}
        />
      ))}
      </Box>
    </Box>
  );
});

export default PianoRoll;