import React,{useEffect, useRef, useState} from "react";
import { Select, MenuItem, Box, Typography, Button, Input} from "@mui/material";
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
const PianoRoll = ({ grid, clearGrid, onGridToggle, noteMode, fillMode, onFillSteps, stepRow, channels, selectedInstrument, onInstrumentChange, numRows, numCols, setRows, setCols, onColsChange}) => {
  
  const [openFillOptions, setOpenFillOptions] = useState(false);
  const [openNotesOptions, setOpenNotesOptions] = useState(false);

  const handleColsChange = (newCols) => {
    setCols(Number(newCols));
    // Notify parent component
    if (onColsChange) {
      onColsChange(Number(newCols));
    }
  };

  const fillOptions = [
    {
      text: "1/8 steps",
    },
    {
      text: "1/4 steps",
    },
    {
      text: "1/2 steps",
    },
    {
      text: "1 step",
    },
    {
      text: "2 steps",
    },
    {
      text: "4 steps",
    },
    {
      text: "8 steps",
    },
    {
      text: "All steps"
    }
  ]

  const notesOptions = [
    {
      text: "A4",
    },
    {
      text: "C4",
    },
    {
      text: "D4",
    },
    {
      text: "E4",
    },
    {
      text: "F4",
    },
    {
      text: "G4",
    },
    {
      text: "A5",
    },
    {
      text: "C5",
    },
  ]  

  return (
    <Box sx={{ p: 2, border: "10px inset white",
      borderRadius: "8px",
      color: "black",
      mt: 2, position: "fixed",
      top: "50%", left: "50%", 
      transform: "translate(-50%, -50%)", overflow: "auto" }}>
      
    <Typography variant="h6" sx={{ mb: 1, fontFamily: "Silkscreen, cursive", color: "white" }}>
      Piano Roll - {selectedInstrument}
    </Typography>
  
     {/* Sélection de l'instrument */}
    <Select
      value={selectedInstrument}
      onChange={(e) => onInstrumentChange(e.target.value)}
      sx={{ mb: 2, width: 80, backgroundColor: "white" }}
    >
      {channels.map((ch, i) => (
        <MenuItem key={i} value={ch}>
          {ch}
        </MenuItem>
      ))}
    </Select>

    {/* Bouton pour ouvrir les options de dimensions de grille */}

    <Box sx={{ position: "static", top: 0, right: 1000, zIndex: 1, gap: 1, mb: 2 }}>

      <Typography sx={{ color: "white" }}>Steps length:</Typography>
      <Input 
        type="number"
        value={numCols}
        onChange={(e) => handleColsChange(Number(e.target.value))}
        inputProps={{ min: 5, max: 100 }}
        sx={{ backgroundColor: "white", width: 80 }}
      />
    </Box>

   {/* Bouton pour ouvrir les options de remplissage */}
    <Button
      sx={{ mb: 2, position: "absolute", top: 0, left: 0, backgroundColor: "white", color: "black", zIndex: 1, "&:hover": { backgroundColor: "gray" } }}
      onClick={() => {
        setOpenFillOptions(!openFillOptions);
        setOpenNotesOptions(false);
      }}
      
    >
      {openFillOptions ? "Select" : <FormatPaintIcon color="black" size={20} />}
      {openFillOptions && (
        <Box sx={{ position: "absolute", top: 30, left: 0, backgroundColor: "white", zIndex: 1 }}>
          {fillOptions.map((option, i) => (
            <MenuItem
              key={i}
              onClick={() => {
                fillMode(option.text);               // définir le fill
                setOpenFillOptions(false);           // fermer le menu fill
                setOpenNotesOptions(true);           // ouvrir le menu notes
              }}
            >
              {option.text}
            </MenuItem>
          ))}
        </Box>
      )}
    </Button>

    {/* Bouton qui efface la grille */}
    <Button
      sx={{ mb: 2, position: "absolute", top: 0, left: 220, backgroundColor: "white", color: "black", zIndex: 1, "&:hover": { backgroundColor: "gray" } }}
      onClick={clearGrid}
    >
      Clear
    </Button>

    {/* Bouton pour ouvrir les options de note */}
    <Button
      sx={{ mb: 2, position: "absolute", top: 0, left: 70, backgroundColor: "white", color: "black", zIndex: 1, "&:hover": { backgroundColor: "gray" } }}
      onClick={() => {
        setOpenNotesOptions(!openNotesOptions);
        setOpenFillOptions(false);
      }}
    >
      {openNotesOptions ? "Select" : <MusicNoteIcon color="black" size={20} />}
      {openNotesOptions && (
        <Box sx={{ position: "absolute", top: 30, left: 0, backgroundColor: "white", zIndex: 1 }}>
          {notesOptions.map((note, i) => (
            <MenuItem
              key={i}
              onClick={() => {
                noteMode(note.text);               // définir la note
                setOpenNotesOptions(false);        // fermer le menu notes
              }}
            >
              {note.text}
            </MenuItem>
          ))}
        </Box>
      )}
    </Button>

    
    <Button
      sx={{ mb: 2, position: "absolute", top: 0, left: 140, backgroundColor: "white", color: "black", zIndex: 1, "&:hover": { backgroundColor: "gray" }}}
      onClick={() => {
        console.log("Filling with:", noteMode, fillMode);
        onFillSteps(noteMode, fillMode);                // Appelle handleFillSteps(noteToFill, fill)
        setOpenFillOptions(false);
        setOpenNotesOptions(false);
      }}
    >
      Fill
    </Button>



    {/* Affichage de la grille */}
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: "50vh", maxWidth: "95vh", overflow: "auto" }}>
      {grid.map((row, rowIdx) => (
        <Box key={rowIdx} sx={{ display: "flex", flexDirection: "row", gap: 1, minWidth: `${grid[0].length * 47}px`}}>
          {row.map((step, stepIdx) => (
            <Box
              key={stepIdx}
              onClick={() => onGridToggle(rowIdx, stepIdx)}
              sx={{
                width: 50,
                height: 50,
                backgroundColor: step ? "red" : "#ddd",
                borderColor: stepRow === stepIdx ? "green" : "black",
                border: stepRow === stepIdx ? "3px solid green" : "1px solid black",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.1s ease",
                "&:hover": {
                  backgroundColor: step ? "#f66" : "#ccc",
                }
              }}
              {...(stepRow === rowIdx && stepIdx === step ? { border: "2px solid red" } : {})}
            />
          ))}
        </Box>
      ))}
    </Box>
  </Box>
  );
};

export default PianoRoll;