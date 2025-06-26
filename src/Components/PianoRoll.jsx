import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { usePlayContext } from '../Contexts/PlayContext';
import { RxWidth } from "react-icons/rx";
import { ImPencil } from "react-icons/im";
import { HiPaintBrush } from "react-icons/hi2";
const PianoRoll = ({
  notes, setNotes,
  selectedPatternID,
  selectedInstrument,
  instrumentList,
  setInstrumentList,
  onOpen,
  onClose
}) => {
  const [mode, setMode] = useState('draw');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const gridRef = useRef(null);
  const { playMode, bpm, isPlaying } = usePlayContext();
  const currentNotes = instrumentList[selectedInstrument]?.pianoData[selectedPatternID] || [];

  const ROWS = 48;
  const COLS = 64;
  const CELL_WIDTH = 20;
  const CELL_HEIGHT = 20;

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const toggleMode = (newMode) => {
    setMode((prev) => (prev === newMode ? null : newMode));
  };
  /*

  useEffect(() => {
  if (!isPlaying || !currentNotes || playMode === 'Pattern') return;

  const sampler = instrumentList[selectedInstrument]?.sampler;
  let step = 0;

  console.log("Current sampler: ",sampler);
  if (!sampler) return;

  
  const loop = new Tone.Loop((time) => { 
    setCurrentStep(step);
    currentNotes.forEach((note) => {
      const noteName = getNoteLabel(note.row); 
      step = (step + 1) % COLS;
      sampler.triggerAttackRelease(noteName, "8n", time + note.start * Tone.Time("16n").toSeconds());
      console.log("Step: ", step);
    });
  }, "4m"); // Exécuter toutes les mesures (ou ajuste selon la grille)

  loop.start(0);
  Tone.Transport.start();
           
  return () => {
    loop.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setCurrentStep(0);  
  };
}, [isPlaying, playMode, currentNotes]);
*/

useEffect(() => {
  if (!isPlaying || !currentNotes || playMode === 'Pattern') return;

  const sampler = instrumentList[selectedInstrument]?.sampler;
  if (!sampler) return;

  let step = 0;

  const loop = new Tone.Loop((time) => {
    setCurrentStep(step);

    const stepNotes = currentNotes.filter(note => note.start === step);
    stepNotes.forEach(note => {
      const noteName = getNoteLabel(note.row);
      sampler.triggerAttackRelease(noteName, "8n", time);
    });

    step = (step + 1) % COLS;
  }, "16n"); // une colonne toutes les double-croches

  loop.start(0);
  Tone.Transport.start();

  return () => {
    loop.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setCurrentStep(0);
  };
}, [isPlaying, playMode, currentNotes]);



  const getNoteLabel = (row) => {
    const octave = Math.floor((ROWS - 1 - row) / 12) + 2;
    const noteIndex = (ROWS - 1 - row) % 12;
    return `${noteNames[noteIndex]}${octave}`;
  };

  const isBlackKey = (row) => {
    const noteIndex = (ROWS - 1 - row) % 12;
    return [1, 3, 6, 8, 10].includes(noteIndex);
  };

  const handleSetNotes = useCallback((updater) => {
    setInstrumentList(prev => {
      const instrument = prev[selectedInstrument];

      if (!instrument) return prev;

      const currentNotes = instrument.pianoData?.[selectedPatternID] || [];

      const newNotes = typeof updater === 'function' ? updater(currentNotes) : updater;

      return {
        ...prev,
        [selectedInstrument]: {
          ...instrument,
          pianoData: {
            ...instrument.pianoData,
            [selectedPatternID]: newNotes
          }
        }
      };
    });
    console.log('updated notes',  instrumentList);
  }, [selectedInstrument, selectedPatternID, setInstrumentList]);

  const handleGridClick = useCallback((e) => {
  if (isResizing) return;

  const rect = gridRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const col = Math.floor(x / CELL_WIDTH);
  const row = Math.floor(y / CELL_HEIGHT);

  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  
  if (mode === 'draw') {
  handleSetNotes((prevNotes) => {
    const existingIndex = prevNotes.findIndex(note =>
      row >= note.row && row < note.row + note.height &&
      col >= note.start && col < note.start + note.length
    );

    if (existingIndex !== -1) {
      // Supprimer la note
      const updated = [...prevNotes];
      updated.splice(existingIndex, 1);
      setSelectedNoteId(null);
      return updated;
    } else {
      // Ajouter une nouvelle note
      const newNote = {
        id: crypto.randomUUID(),
        row,
        start: col,
        length: 2,
        height: 1,
        pitch: ROWS - 1 - row
      };
      setSelectedNoteId(newNote.id);
      return [...prevNotes, newNote];
    }
  });
  }
}, [isResizing, gridRef, handleSetNotes, mode]);


  const handleNoteMouseDown = useCallback((e, note, direction = null) => {
    e.stopPropagation();
    setSelectedNoteId(note.id);
    if (direction) {
      setIsResizing(true);
      setResizeDirection(direction);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
  if (!isResizing || !selectedNoteId || mode !== 'resize') return;

  const rect = gridRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const col = Math.floor(x / CELL_WIDTH);

  handleSetNotes(prevNotes =>
  prevNotes.map(note => {
    if (note.id !== selectedNoteId) return note;

    const debugInfo = { oldLength: note.length };
    const minCol = col / 0.5;

    if (resizeDirection === 'left') {
      const newStart = Math.max(0, Math.min(minCol, note.start + note.length - 1));
      const newLength = note.start + note.length - newStart;
      debugInfo.newLength = newLength;
      console.log('Resize left', debugInfo);
      return { ...note, start: newStart, length: newLength };
    } else if (resizeDirection === 'right') {
      const newLength = Math.max(1, minCol - note.start + 1);
      debugInfo.newLength = newLength;
      console.log('Resize right', debugInfo);
      return { ...note, length: Math.min(newLength, COLS - note.start) };
    }

    return note;
  })
);

}, [isResizing, selectedNoteId, resizeDirection, gridRef, handleSetNotes]);


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

  useEffect(() => {
  const handleMouseDown = () => setIsMouseDown(true);
  const handleMouseUp = () => setIsMouseDown(false);

  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);

  return () => {
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  }, []);


  const clearAll = () => {
    handleSetNotes([]);
    setSelectedNoteId(null);
  };

  const handlePlaySound = async (_, row) => {
    const noteLabel = getNoteLabel(row);
    await Tone.start();

    const instrument = instrumentList[selectedInstrument];
    if (!instrument?.sampler) {
      console.warn("Aucun sampler chargé pour l’instrument sélectionné.");
      return;
    }

    instrument.sampler.triggerAttackRelease(noteLabel, "8n");
  };

  const handlePaintCell = (row, col) => {
  if (!isMouseDown || mode !== 'paint') return;

  handleSetNotes((prevNotes) => {
    const exists = prevNotes.some(note =>
      row === note.row && col >= note.start && col < note.start + note.length
    );
    if (exists) return prevNotes; // éviter les doublons

    const newNote = {
      id: crypto.randomUUID(),
      row,
      start: col,
      length: 2,
      height: 1,
      pitch: ROWS - 1 - row
    };

    return [...prevNotes, newNote];
  });
  };

  return (
    <div ref={onOpen} className="w-230 h-140 fixed bg-gray-900 text-white border-2 border-white p-4 overflow-auto resize">
      <div className="mb-4 flex gap-2 items-center ml-20 justify-start">
        <label className="absolute left-0 px-4 py-2 ml-4 bg-gray-800 rounded">{selectedInstrument}</label>
        <button
          onClick={() => toggleMode('draw')}
          className={`px-4 py-2 rounded ${mode === 'draw' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
        <ImPencil size={20} />
        </button>
        <button
          onClick={() => toggleMode('paint')}
          className={`px-4 py-2 rounded ${mode === 'paint' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          <HiPaintBrush size={20} />
        </button>
        <button
          onClick={() => toggleMode('resize')}
          className={`px-4 py-2 rounded ${mode === 'resize' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          <RxWidth size={20} />
        </button>

        <button onClick={clearAll} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded">Clear All</button>
        <button className="relative top-0 left-8 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded" onClick={onClose}>X</button>
      </div>


      <div className="flex">
      
        {/* Piano Keys */}
        <div className="flex flex-col flex-shrink-0 mt-6">
          {Array.from({ length: ROWS }, (_, i) => (
            <button
              key={i}
              className={`
                w-15 h-5 border-gray-600 flex items-center justify-end
                ${isBlackKey(i) ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'}
              `}
              onClick={() => handlePlaySound(null, i)}
              style={{ height: `${CELL_HEIGHT}px` }}
            >
              {getNoteLabel(i)}
            </button>
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
          {/* Grille interactive */}
          <div
            ref={gridRef}
            className="relative cursor-crosshair select-none"
            onClick={handleGridClick}
            style={{
              width: `${COLS * CELL_WIDTH}px`,
              height: `${ROWS * CELL_HEIGHT}px`,
            }}
          >
            {/* Timeline */}
            <div
              className="absolute bg-red-900 pointer-events-none z-10 transition-all duration-10"
              style={{
                left: `${currentStep * CELL_WIDTH}px`,
                width: `${CELL_WIDTH / 8}px`,
                height: `${ROWS * CELL_HEIGHT}px`,
              }}
            />
            {/* Grille interactive par cellule */}
            {Array.from({ length: ROWS }).map((_, row) =>
              Array.from({ length: COLS }).map((_, col) => (
                <div
                  key={`cell-${row}-${col}`}
                  className="absolute"
                  style={{
                    top: `${row * CELL_HEIGHT}px`,
                    left: `${col * CELL_WIDTH}px`,
                    width: `${CELL_WIDTH}px`,
                    height: `${CELL_HEIGHT}px`,
                  }}
                  onMouseEnter={() => handlePaintCell(row, col)}
                />
              ))
            )}
            {/* Lignes visuelles */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: ROWS + 1 }, (_, i) => (
                <div
                  key={`h-${i}`}
                  className={`absolute border-t ${i % 12 === 0 ? 'border-gray-500' : 'border-gray-700'}`}
                  style={{ top: `${i * CELL_HEIGHT}px`, width: '100%' }}
                />
              ))}
              {Array.from({ length: COLS + 1 }, (_, i) => (
                <div
                  key={`v-${i}`}
                  className={`absolute border-l ${i % 4 === 0 ? 'border-gray-500' : 'border-gray-700'}`}
                  style={{ left: `${i * CELL_WIDTH}px`, height: '100%' }}
                />
              ))}
            </div>

            {/* Notes affichées */}
            {currentNotes.map((note) => (
              <div
                key={note.id}
                className={`absolute rounded border-2 cursor-grab ${
                  selectedNoteId === note.id
                    ? 'bg-blue-500 border-blue-300 shadow-lg'
                    : 'bg-blue-600 border-blue-400 hover:bg-blue-500'
                }`}
                style={{
                  left: `${note.start * CELL_WIDTH}px`,
                  top: `${note.row * CELL_HEIGHT}px`,
                  width: `${note.length * CELL_WIDTH}px`,
                  height: `${note.height * CELL_HEIGHT}px`,
                }}
                onMouseDown={(e) => handleNoteMouseDown(e, note)}
              >
                <div
                  className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80"
                  onMouseDown={(e) => handleNoteMouseDown(e, note, 'left')}
                />
                <div
                  className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80"
                  onMouseDown={(e) => handleNoteMouseDown(e, note, 'right')}
                />
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
