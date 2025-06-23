import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useProjectManager } from '../Hooks/useProjectManager';
import * as Tone from 'tone';

const PianoRoll = ({selectedInstrument, instrumentList, onOpen, onClose}) => {
  const [selectedNote, setSelectedNote] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const gridRef = useRef(null);

  const { notes, setNotes } = useProjectManager();
  // Configuration
  const ROWS = 48; // 4 octaves
  const COLS = 64; // 16 mesures * 4 temps
  const CELL_WIDTH = 20;
  const CELL_HEIGHT = 20;
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const getNoteLabel = (row) => {
    const octave = Math.floor((ROWS - 1 - row) / 12) + 2;
    const noteIndex = (ROWS - 1 - row) % 12;
    return `${noteNames[noteIndex]}${octave}`;
  };

  const isBlackKey = (row) => {
    const noteIndex = (ROWS - 1 - row) % 12;
    return [1, 3, 6, 8, 10].includes(noteIndex); // C#, D#, F#, G#, A#
  };

  const handleGridClick = useCallback((e) => {
    if (isResizing) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / CELL_WIDTH);
    const row = Math.floor(y / CELL_HEIGHT);
    
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    
    // Vérifier s'il y a déjà une note à cette position
    const existingNoteIndex = notes.findIndex(note => 
      row >= note.row && row < note.row + note.height &&
      col >= note.start && col < note.start + note.length
    );
    
    if (existingNoteIndex !== -1) {
      // Supprimer la note existante
      setNotes(prev => prev.filter((_, index) => index !== existingNoteIndex));
      setSelectedNote(null);
    } else {
      // Ajouter une nouvelle note
      const newNote = {
        id: Date.now(),
        row,
        start: col,
        length: 2,
        height: 1,
        pitch: ROWS - 1 - row
      };
      setNotes(prev => [...prev, newNote]);
      console.log(newNote.pitch);
      setSelectedNote(newNote.pitch);
    }
  }, [notes, isResizing]);

  const handleNoteMouseDown = useCallback((e, note, direction = null) => {
    e.stopPropagation();
    setSelectedNote(note.id);
    
    if (direction) {
      setIsResizing(true);
      setResizeDirection(direction);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !selectedNote) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor(x / CELL_WIDTH);
    
    setNotes(prev => prev.map(note => {
      if (note.id !== selectedNote) return note;
      
      if (resizeDirection === 'left') {
        const newStart = Math.max(0, Math.min(col, note.start + note.length - 1));
        const newLength = note.start + note.length - newStart;
        return { ...note, start: newStart, length: newLength };
      } else if (resizeDirection === 'right') {
        const newLength = Math.max(1, col - note.start + 1);
        return { ...note, length: Math.min(newLength, COLS - note.start) };
      }
      
      return note;
    }));
  }, [isResizing, selectedNote, resizeDirection]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const clearAll = () => {
    setNotes([]);
    setSelectedNote(null);
  };

 const handlePlaySound = async (selectedNote, i) => {


  setSelectedNote(getNoteLabel(i));
  console.log("Note à jouer:", getNoteLabel(i));

  await Tone.start();

  const instrument = instrumentList[selectedInstrument];

  if (!instrument || !instrument.sampler) {
    console.warn("Aucun sampler chargé pour l’instrument sélectionné.");
    return;
  }

  //console.log(`Jouer ${noteLabel} sur ${selectedInstrument}`);
  instrument.sampler.triggerAttackRelease(selectedNote, "8n");
};

  return (
    <div ref={onOpen} className="w-230 h-140 fixed bg-gray-900 text-white border-2 border-white p-4 overflow-auto resize">
      <div className="mb-4 flex gap-2 items-center ml-20 justify-start">
        <label
          className="absolute left-0 px-4 py-2 ml-4 bg-gray-800 rounded transition-colors"
        >
          {selectedInstrument}
        </label>
        <button 
          onClick={clearAll}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Clear All
        </button>
        <button className="relative top-0 left-8 px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors" onClick={onClose}> X </button>
      </div>
      
      <div className="flex">
        {/* Piano Keys */}
        <div className="flex flex-col flex-shrink-0 mt-6 border-gray-600">
          {Array.from({ length: ROWS }, (_, i) => (
            <div
              key={i}
            >
              <button className={`
                w-15 h-5 border-gray-600 flex items-center justify-end
                ${isBlackKey(i) 
                  ? 'bg-gray-800 text-gray-300' 
                  : 'bg-gray-100 text-gray-800'
                }
              `}
              onClick={() => handlePlaySound(selectedNote, i)}
              style={{ height: `${CELL_HEIGHT}px` }}>
                {getNoteLabel(i)}
              </button>
            
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="relative">
          {/* Mesures */}
          <div className="flex border-b border-gray-600 bg-gray-800">
            {Array.from({ length: COLS / 4 }, (_, i) => (
              <div
                key={i}
                className="border-r border-gray-600 text-center text-xs py-1 text-gray-300"
                style={{ width: `${CELL_WIDTH * 4}px` }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Grille principale */}
          <div
            ref={gridRef}
            className="relative cursor-crosshair select-none"
            onClick={handleGridClick}
            style={{
              width: `${COLS * CELL_WIDTH}px`,
              height: `${ROWS * CELL_HEIGHT}px`,
            }}
          >
            {/* Lignes de grille */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Lignes horizontales */}
              {Array.from({ length: ROWS + 1 }, (_, i) => (
                <div
                  key={`h-${i}`}
                  className={`absolute border-t ${
                    i % 12 === 0 ? 'border-gray-500' : 'border-gray-700'
                  }`}
                  style={{ top: `${i * CELL_HEIGHT}px`, width: '100%' }}
                />
              ))}
              
              {/* Lignes verticales */}
              {Array.from({ length: COLS + 1 }, (_, i) => (
                <div
                  key={`v-${i}`}
                  className={`absolute border-l ${
                    i % 4 === 0 ? 'border-gray-500' : 'border-gray-700'
                  }`}
                  style={{ left: `${i * CELL_WIDTH}px`, height: '100%' }}
                />
              ))}
            </div>
            
            {/* Fond alterné pour les touches noires */}
            {Array.from({ length: ROWS }, (_, i) => (
              isBlackKey(i) && (
                <div
                  key={`bg-${i}`}
                  className="absolute bg-opacity-30 pointer-events-none"
                  style={{
                    top: `${i * CELL_HEIGHT}px`,
                    width: '100%',
                    height: `${CELL_HEIGHT}px`,
                  }}
                />
              )
            ))}
            
            {/* Notes */}
            {notes.map((note) => (
              <div
                key={note.id}
                className={`
                  absolute rounded border-2 cursor-pointer transition-all
                  ${selectedNote === note.id 
                    ? 'bg-blue-500 border-blue-300 shadow-lg' 
                    : 'bg-blue-600 border-blue-400 hover:bg-blue-500'
                  }
                `}
                style={{
                  left: `${note.start * CELL_WIDTH}px`,
                  top: `${note.row * CELL_HEIGHT}px`,
                  width: `${note.length * CELL_WIDTH}px`,
                  height: `${note.height * CELL_HEIGHT}px`,
                }}
                onMouseDown={(e) => handleNoteMouseDown(e, note)}
              >
                {/* Poignée de redimensionnement gauche */}
                <div
                  className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80"
                  onMouseDown={(e) => handleNoteMouseDown(e, note, 'left')}
                />
                
                {/* Poignée de redimensionnement droite */}
                <div
                  className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80"
                  onMouseDown={(e) => handleNoteMouseDown(e, note, 'right')}
                />
                
                {/* Contenu de la note */}
                <div className="absolute inset-2 flex items-center justify-center text-xs font-semibold text-white">
                  {getNoteLabel(note.row)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;