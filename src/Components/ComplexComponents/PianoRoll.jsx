import React, {useCallback, useContext, useState} from "react";
import { Box, Button, Typography} from "@mui/material";
import * as ReactIcons from "react-icons/md";
import * as Tone from "tone";
import PianoMenu from "../FrontEnd/PianoMenu";
import { useCursorManager } from "../Contexts/CursorManager";

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

const PianoRoll = ({
  grid,
  onGridToggle,
  rows,
  cols,
  onColsChange,
  onClearGrid,
  onCopy,
  onPaste,
  selectedInstrument
}) => {
const noteList = generateNoteList(rows).reverse(); // pour avoir aigu en haut
const { cursor, setCursor } = useCursorManager();
const [drawMode, setDrawMode] = useState(false);

const playNote = (note) => {
  const synth = new Tone.Synth().toDestination();
  synth.triggerAttackRelease(note, "8n");
};

const handleToggleDrawMode = () => {
  setDrawMode((prev) => !prev);
  setCursor("crosshair");
}



return (
    <Box
    
      sx={{
        display: "flex",
        position: "fixed",
        top: "58%",
        left: "46%",
        transform: "translate(-50%, -50%)",
        bgcolor: "#111",
        border: "6px inset #fff",
        borderRadius: 2,
        width: "50%",
        height: "80%",
        overflow: "auto",
        p: 2,
        cursor: cursor
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", color: "#fff" }}>
        Piano Roll - {selectedInstrument}
      </Typography>
      {/* Controls */}
      <Box sx={{ position: "absolute", top: 10, left: 20, display: "flex", gap: 2 }}>
        <PianoMenu onCut={onClearGrid} onCopy={onCopy} onPaste={onPaste}/>
        <Button
          onClick={handleToggleDrawMode}
          sx={{ fontSize: 12, bgcolor: "transparent", color: "#fff", fontFamily: "monospace" }}
        >
          <ReactIcons.MdDraw size={20} />
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
                fontSize: "0.9rem",
                fontFamily: "initial",
                fontWeight: "bold",
                color: "white",
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
          <Box key={rowIdx} sx={{ display: "flex", flexDirection: "row" }}>
            {/* Piano key */}
            <Box
              onClick={() => playNote(note)}
              sx={{
                width: 90,
                minWidth: 60,
                height: 22,
                backgroundColor: isBlackKey(note) ? "#333" : "#fff",
                color: isBlackKey(note) ? "#eee" : "#000",
                borderRight: "1px solid #666",
                borderBottom: "1px solid #444",
                display: "flex",
                alignItems: "center",
                paddingLeft: 1,
                cursor: "pointer",
                fontSize: "0.8rem",
                fontFamily: "monospace",
                position: "sticky",
                left: 0,
                zIndex: 2,
                boxShadow: "2px 0px 5px rgba(0,0,0,0.3)"
              }}
            >
              {note}
            </Box>

            {/* Grid cells for this row */}
            {grid[rowIdx].map((step, colIdx) => (
              <Box
                key={colIdx}
                onClick={() => onGridToggle(rowIdx, colIdx)}
                sx={{
                  width: 30,
                  height: 22,
                  bgcolor: step 
                    ? "#4caf50" 
                    : isBlackKey(note) 
                      ? "#1a1a1a" 
                      : "#222",
                  borderBottom: `1px solid ${isBlackKey(note) ? "#2a2a2a" : "#333"}`,
                  borderRight: "1px dotted #444",
                  "&:hover": {
                    bgcolor: step ? "#f44336" : "#555",
                    cursor: "pointer"
                  },
                  // Highlight beats
                  ...(colIdx % 4 === 0 && {
                    borderLeft: "1px solid #666"
                  })
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PianoRoll;