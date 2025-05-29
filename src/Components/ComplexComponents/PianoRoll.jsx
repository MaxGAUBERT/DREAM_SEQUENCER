import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Box, Button, Typography } from "@mui/material";
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
  isPlaying,
  currentStep
}) => {
  const noteList = useMemo(() => generateNoteList(rows).reverse(), [rows]);
  const { cursor, setCursor } = useCursorManager();
  
  // État optimisé pour les interactions
  const [interactionState, setInteractionState] = useState({
    mode: "draw", // "draw", "paint", "move"
    isMouseDown: false,
    isPainting: false,
    movingNote: null, // { fromRow, fromCol, moved }
    paintedCells: new Set() // Track painted cells to avoid duplicates
  });

  // Refs pour éviter les re-renders et améliorer les performances
  const stateRef = useRef(interactionState);
  const gridRef = useRef(grid);
  const synthRef = useRef(null);

  // Mettre à jour les refs à chaque render
  useEffect(() => {
    stateRef.current = interactionState;
    gridRef.current = grid;
  });

  // Initialiser le synth une seule fois
  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  // Optimisation du lecture de note
  const playNote = useCallback((note) => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(note, "8n");
    }
  }, []);

  // Fonction utilitaire pour mettre à jour l'état d'interaction
  const updateInteractionState = useCallback((updates) => {
    setInteractionState(prev => ({ ...prev, ...updates }));
  }, []);

  // Sélecteur de mode optimisé
  const selectMode = useCallback((newMode) => {
    updateInteractionState({
      mode: newMode,
      movingNote: null,
      isPainting: false,
      paintedCells: new Set()
    });
  }, [updateInteractionState]);

  const handleMouseDown = useCallback((row, col) => {
    const currentState = stateRef.current;
    const currentGrid = gridRef.current;

    updateInteractionState({ isMouseDown: true });

    switch (currentState.mode) {
      case "move":
        if (currentGrid[row][col]) {
          updateInteractionState({
            movingNote: { fromRow: row, fromCol: col, toRow: row, toCol: col }
          });
        }
        break;

      case "draw":
        requestAnimationFrame(() => {
          onGridToggle(row, col);
        });
        break;

      case "paint":
        const paintedCells = new Set();
        paintedCells.add(`${row}-${col}`);
        updateInteractionState({ 
          isPainting: true, 
          paintedCells 
        });
        requestAnimationFrame(() => {
          onGridToggle(row, col);
        });
        break;
    }
  }, [onGridToggle, updateInteractionState]);

  const handleMouseEnter = useCallback((row, col) => {
    const currentState = stateRef.current;
    const currentGrid = gridRef.current;

    if (!currentState.isMouseDown) return;

    switch (currentState.mode) {
      case "paint":
        const cellKey = `${row}-${col}`;
        if (!currentState.paintedCells.has(cellKey)) {
          const newPaintedCells = new Set(currentState.paintedCells);
          newPaintedCells.add(cellKey);
          updateInteractionState({ paintedCells: newPaintedCells });

          requestAnimationFrame(() => {
            if (!currentGrid[row][col]) {
              onGridToggle(row, col);
            }
          });
        }
        break;

      case "move":
        const move = currentState.movingNote;
        if (move) {
          const { fromRow, fromCol, toRow, toCol } = move;

          if ((row === toRow && col === toCol) || currentGrid[row][col]) return;

          requestAnimationFrame(() => {
            // Supprime l'ancienne destination (si différente de source)
            if (!(toRow === fromRow && toCol === fromCol)) {
              if (currentGrid[toRow][toCol]) {
                onGridToggle(toRow, toCol);
              }
            }

            // Supprime la source si encore existante
            if (currentGrid[fromRow][fromCol]) {
              onGridToggle(fromRow, fromCol);
            }

            // Ajoute à la nouvelle destination
            onGridToggle(row, col);

            updateInteractionState({
              movingNote: {
                fromRow,
                fromCol,
                toRow: row,
                toCol: col
              }
            });
          });
        }
        break;
    }
  }, [onGridToggle, updateInteractionState]);

  const handleMouseUp = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.isMouseDown) {
      updateInteractionState({
        isMouseDown: false,
        isPainting: false,
        movingNote: null,
      });
    }
}, [updateInteractionState]);


  // Gestionnaire MouseLeave optimisé
  const handleMouseLeave = useCallback(() => {
    updateInteractionState({
      isPainting: false
    });
  }, [updateInteractionState]);

  // Gestionnaires d'événements globaux optimisés
  useEffect(() => {
    const preventDefaultDrag = (e) => {
      if (interactionState.mode === "paint") {
        e.preventDefault();
        return false;
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    // Utiliser les options passive pour de meilleures performances
    document.addEventListener('dragstart', preventDefaultDrag, { passive: false });
    document.addEventListener('selectstart', preventDefaultDrag, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp, { passive: true });
    
    return () => {
      document.removeEventListener('dragstart', preventDefaultDrag);
      document.removeEventListener('selectstart', preventDefaultDrag);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [interactionState.mode, handleMouseUp]);

  // Optimisation des propriétés calculées
  const modeStyles = useMemo(() => ({
    draw: { bgcolor: interactionState.mode === "draw" ? "#444" : "transparent" },
    paint: { bgcolor: interactionState.mode === "paint" ? "#444" : "transparent" },
    move: { bgcolor: interactionState.mode === "move" ? "#444" : "transparent" }
  }), [interactionState.mode]);

  // Optimisation des en-têtes de colonnes
  const stepHeaders = useMemo(() => 
    Array.from({ length: cols }, (_, idx) => (
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
    )), [cols]
  );

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
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none"
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          position: "fixed", 
          top: 10, 
          right: 15, 
          justifyContent: "right", 
          display: "flex", 
          width: "100%", 
          color: "#fff" 
        }}
      >
        Piano Roll - {selectedInstrument}
      </Typography>

      {/* Controls optimisés */}
      <Box sx={{ position: "absolute", top: 10, left: 20, display: "flex", gap: 2 }}>
        <PianoMenu onCut={onClearGrid} onCopy={onCopy} onPaste={onPaste}/>
        
        <Button
          onClick={() => selectMode("draw")}
          sx={{ 
            fontSize: 12, 
            ...modeStyles.draw, 
            color: "#fff", 
            fontFamily: "monospace",
            minWidth: 40
          }}
        >
          <ReactIcons.MdDraw size={20} />
        </Button>

        <Button
          onClick={() => selectMode("paint")}
          sx={{ 
            fontSize: 12, 
            ...modeStyles.paint, 
            color: "#fff", 
            fontFamily: "monospace",
            minWidth: 40
          }}
        >
          <PiPaintBrushHousehold size={20} />
        </Button>

        <Button
          onClick={() => selectMode("move")}
          sx={{ 
            fontSize: 12, 
            ...modeStyles.move, 
            color: "#fff", 
            fontFamily: "monospace",
            minWidth: 40
          }}
        >
          <IoMove size={20} />
        </Button>
      </Box>

      {/* Grille complète avec piano intégré */}
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", mt: 4 }}>
        {/* Step headers optimisés */}
        <Box sx={{ display: "flex", flexDirection: "row", ml: 8.8 }}>
          {stepHeaders}
        </Box>

        {/* Grid rows avec piano intégré */}
        {noteList.map((note, rowIdx) => (
          <PianoRollRow
            key={`${note}-${rowIdx}`} // Clé plus stable
            note={note}
            rowIdx={rowIdx}
            rowData={grid[rowIdx]}
            playNote={playNote}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseUp={handleMouseUp}
            handleMouseLeave={handleMouseLeave}
            currentStep={currentStep}
          />
        ))}
      </Box>
    </Box>
  );
});

PianoRoll.displayName = 'PianoRoll';

export default PianoRoll;