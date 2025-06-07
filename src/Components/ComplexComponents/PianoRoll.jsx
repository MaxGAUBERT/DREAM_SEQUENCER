import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as ReactIcons from "react-icons/md";
import * as Tone from "tone";
import PianoMenu from "../FrontEnd/PianoMenu";
import { IoMove } from "react-icons/io5";
import { PiPaintBrushHousehold } from "react-icons/pi";
import PianoRollRow from "./PianoRollRow";
import { useHoverInfo } from '../Contexts/HoverInfoContext';
import { useGridData } from "../Contexts/GridData";

const PianoRoll = React.memo(({
  grid,
  sampleUrl,
  onGridToggle,
  ensureGridSize,
  updateGrids,
  rows,
  cols,
  onClearGrid,
  onCopy,
  onPaste,
  selectedInstrument,
  isPlaying,
  currentStep
}) => {
  const { createHoverProps } = useHoverInfo();
  const { noteList } = useGridData();
  
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

  useEffect(() => {
    // Nettoyer l'ancien sampler
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }

    // Créer un nouveau sampler si une URL est fournie
    if (sampleUrl) {
      try {
        synthRef.current = new Tone.Sampler({ 
          urls: { C4: sampleUrl }, 
          release: 1 
        }).toDestination();
      } catch (error) {
        console.error("Erreur lors de la création du sampler:", error);
      }
    }

    // Cleanup
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, [sampleUrl, selectedInstrument]);

  // Optimisation du lecture de note
  const playNote = useCallback((note) => {
    if (synthRef.current && sampleUrl) {
      try {
        synthRef.current.triggerAttackRelease(note, "8n");
      } catch (error) {
        console.error("Erreur lors de la lecture de la note:", error);
      }
    } else {
      console.warn(`Aucun sample chargé pour ${selectedInstrument}`);
    }
  }, [sampleUrl, selectedInstrument]);

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

        case "move": {
          const moving = interactionState.movingNote;
          if (!moving) return;

          const { fromRow, fromCol } = moving;

          updateGrids(prev => {
            const newGrid = ensureGridSize(prev[selectedInstrument]);
            const updatedGrid = newGrid.map((r, rIdx) =>
              r.map((cell, cIdx) => {
                if (rIdx === fromRow && cIdx === fromCol) return false;
                if (rIdx === row && cIdx === col) return true;
                return cell;
              })
            );
            return { ...prev, [selectedInstrument]: updatedGrid };
          });

          updateInteractionState(prev => ({
            ...prev,
            movingNote: { ...prev.movingNote, toRow: row, toCol: col }
          }));
          break;
        }

        default: 
          break;

    }
  }, [onGridToggle, updateInteractionState, gridRef, interactionState]);

  const handleMouseUp = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.isMouseDown) {
      setInteractionState(prev => ({
      ...prev,
      isMouseDown: false,
      isPainting: false,
      movingNote: null,
      paintedCells: new Set()
    }));

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


  // Optimisation des en-têtes de colonnes
  const stepHeaders = useMemo(() => 
    Array.from({ length: cols }, (_, idx) => (
     <div
      key={idx}
      className={`
        w-[30px] h-[20px]
        text-white
        text-xs
        text-center
        font-sans
        border-b border-[#555]
        self-center
        ml-3.5
        ${idx % 4 === 0 ? "bg-[#333]" : "bg-transparent"}
      `}
    >
      {idx + 1}
    </div>

    )), [cols]
  );

  return (
  <div
  style={{ backgroundColor: "black"}}

    className="
      fixed flex
      top-[55%] left-1/2
      -translate-x-1/2 -translate-y-1/2
      bg-[#111]
      border-[4px] border-inset border-white
      rounded-md
      w-2/4
      h-[90%]
      overflow-auto
      p-2
      select-none
      "
    onDragStart={(e) => e.preventDefault()
    }
  
  >
    <h6
      className="
        fixed top-2.5 right-5
        text-white
      "
    >
      Piano Roll - {selectedInstrument}
    </h6>

    {/* Controls optimisés */}
    <div className="absolute top-2.5 left-5 flex gap-2">
      <PianoMenu onCut={onClearGrid} onCopy={onCopy} onPaste={onPaste} />

      <button
      {...createHoverProps("draw")}
        onClick={() => selectMode("draw")}
        className={`text-xs font-mono min-w-[40px]`}
      >
        <ReactIcons.MdDraw color="white" size={20} />
      </button>

      <button
      
      {...createHoverProps("paint")}
        onClick={() => selectMode("paint")}
        className={`text-xs font-mono min-w-[40px]`}
      >
        
        <PiPaintBrushHousehold color="white" size={20} />
      </button>

      <button
      {...createHoverProps("move")}
        onClick={() => selectMode("move")}
        className={`text-xs font-mono min-w-[40px] bg-color-gray-500`}
    
      >
        <IoMove color="white" size={20} />
      </button>
    </div>

    {/* Grille complète avec piano intégré */}
    <div className="flex flex-col w-screen mt-15">
      {/* Step headers optimisés */}
      <div className="flex flex-row items-center justify-center ml-[80px]">{stepHeaders}</div>

      {/* Grid rows avec piano intégré */}
      {noteList.map((note, rowIdx) => (
        <PianoRollRow
          key={`${note}-${rowIdx}`} // Clé plus stable
          note={note}
          rowIdx={rowIdx}
          rowData={grid[rowIdx]}
          playNote={playNote}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          currentStep={currentStep}
        />
      ))}
    </div>
  </div>
);

});

PianoRoll.displayName = 'PianoRoll';

export default PianoRoll;