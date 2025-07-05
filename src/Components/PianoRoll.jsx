import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import * as Tone from 'tone';
import { usePlayContext } from '../Contexts/PlayContext';
import { RxWidth } from "react-icons/rx";
import { ImPencil } from "react-icons/im";
import { HiPaintBrush } from "react-icons/hi2";
import { MdOutlineDeleteOutline } from "react-icons/md";

const ROWS = 48;
const CELL_WIDTH = 20;
const CELL_HEIGHT = 20;
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const PianoRoll = React.memo(({ selectedPatternID, selectedInstrument, instrumentList, setInstrumentList, onOpen, onClose }) => {
  const [mode, setMode] = useState('draw');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [cols, setCols] = useState(16);
  const gridRef = useRef(null);
  const loopRef = useRef(null);
  const stepRef = useRef(0);
  const instrumentListRef = useRef(instrumentList);
  const selectedPatternIDRef = useRef(selectedPatternID);
  const noteLabelsRef = useRef([]);

  const { isPlaying, playMode } = usePlayContext();
  const playModeRef = useRef(playMode);
  const COLS = cols;

  const currentNotes = useMemo(() =>
    instrumentList[selectedInstrument]?.pianoData?.[selectedPatternID] || [],
    [instrumentList, selectedInstrument, selectedPatternID]
  );

  const toggleMode = (newMode) => setMode((prev) => (prev === newMode ? null : newMode));

  const noteLabels = useMemo(() => {
    const labels = Array.from({ length: ROWS }, (_, i) => {
      const octave = Math.floor((ROWS - 1 - i) / 12) + 2;
      const noteIndex = (ROWS - 1 - i) % 12;
      return `${noteNames[noteIndex]}${octave}`;
    });
    noteLabelsRef.current = labels;
    return labels;
  }, []);

  const horizontalGridLines = useMemo(() =>
    Array.from({ length: ROWS + 1 }, (_, i) => (
      <div key={`h-${i}`} className={`absolute border-t ${i % 12 === 0 ? 'border-gray-500' : 'border-gray-700'}`} style={{ top: `${i * CELL_HEIGHT}px`, width: '100%' }} />
    )), []
  );

  const verticalGridLines = useMemo(() =>
    Array.from({ length: COLS + 1 }, (_, i) => (
      <div key={`v-${i}`} className={`absolute border-l ${i % 4 === 0 ? 'border-gray-500' : 'border-gray-700'}`} style={{ left: `${i * CELL_WIDTH}px`, height: '100%' }} />
    )), [COLS]
  );

  const topBarMeasureLabels = useMemo(() =>
    Array.from({ length: COLS / 4 }, (_, i) => (
      <div key={i} className="border-r border-gray-600 text-center text-xs py-1 text-gray-300" style={{ width: `${CELL_WIDTH * 4}px` }}>{i + 1}</div>
    )), [COLS]
  );

  const isBlackKey = useCallback((row) => [1, 3, 6, 8, 10].includes((ROWS - 1 - row) % 12), []);

  useEffect(() => { instrumentListRef.current = instrumentList; }, [instrumentList]);
  useEffect(() => { selectedPatternIDRef.current = selectedPatternID; }, [selectedPatternID]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);

  useEffect(() => {
    if (!isPlaying || loopRef.current) return;

    loopRef.current = new Tone.Loop((time) => {
      const step = stepRef.current;
      setCurrentStep(step);

      const currentInstrumentList = instrumentListRef.current;
      const currentPatternID = selectedPatternIDRef.current;
      const currentPlayMode = playModeRef.current;

      Object.values(currentInstrumentList).forEach(instrument => {
        const sampler = instrument?.sampler;
        const pianoData = instrument?.pianoData?.[currentPatternID] || [];
        if (!sampler || currentPlayMode !== 'Pattern') return;

        pianoData.filter(n => n.start === step).forEach(n => {
          const noteName = noteLabelsRef.current[n.row];
          const duration = new Tone.Time("16n").toSeconds() * n.length;
          sampler.triggerAttack(noteName, time);
          sampler.triggerRelease(duration, time + 1);
        });
      });

      stepRef.current = (step + 1) % COLS;
    }, "16n");

    loopRef.current.start(0);
    Tone.Transport.start();

    return () => {
      loopRef.current.dispose();
      loopRef.current = null;
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setCurrentStep(0);
      stepRef.current = 0;
    };
  }, [isPlaying, COLS]);

  const handleSetNotes = useCallback((updater) => {
  
    setInstrumentList(prev => {
      const instrument = prev[selectedInstrument];
      if (!instrument) return prev;
      const current = instrument.pianoData?.[selectedPatternID] || [];
      const updated = typeof updater === 'function' ? updater(current) : updater;

      return {
        ...prev,
        [selectedInstrument]: {
          ...instrument,
          pianoData: {
            ...instrument.pianoData,
            [selectedPatternID]: updated,
          },
        },
      };
    });
  }, [selectedInstrument, selectedPatternID, setInstrumentList]);

  const handlePlaySound = async (_, row) => {
    await Tone.start();
    const noteLabel = noteLabelsRef.current[row];
    const instrument = instrumentList[selectedInstrument];
    instrument?.sampler?.triggerAttackRelease(noteLabel, "4n");
  };

  const handleGridClick = useCallback((e) => {
    if (isResizing) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL_WIDTH);
    const row = Math.floor(y / CELL_HEIGHT);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    if (mode === 'draw') {
      handlePlaySound(null, row);
      handleSetNotes((prev) => {
        const existingIndex = prev.findIndex(n => row >= n.row && row < n.row + n.height && col >= n.start && col < n.start + n.length);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated.splice(existingIndex, 1);
          setSelectedNoteId(null);
          return updated;
        } else {
          const newNote = { id: crypto.randomUUID(), row, start: col, length: 2, height: 1, pitch: ROWS - 1 - row };
          setSelectedNoteId(newNote.id);
          return [...prev, newNote];
        }
      });
    }
  }, [isResizing, mode, COLS, handleSetNotes]);

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

    handleSetNotes(prev => prev.map(note => {
      if (note.id !== selectedNoteId) return note;
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
  }, [isResizing, selectedNoteId, resizeDirection, mode, COLS, handleSetNotes]);

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
    const down = () => setIsMouseDown(true);
    const up = () => setIsMouseDown(false);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  const clearAll = () => {
    handleSetNotes([]);
    setSelectedNoteId(null);
  };

  const handlePaintCell = useCallback((row, col) => {
    if (!isMouseDown || mode !== 'paint') return;
    handleSetNotes(prev => {
      if (prev.some(n => n.row === row && col >= n.start && col < n.start + n.length)) return prev;
      return [...prev, { id: crypto.randomUUID(), row, start: col, length: 2, height: 1, pitch: ROWS - 1 - row }];
    });
  }, [isMouseDown, mode, handleSetNotes]);

  return (
    <div ref={onOpen} className="w-screen h-140 fixed bg-gray-900 text-white border-2 border-white p-3 overflow-auto resize">
      <div className="flex gap-2 mb-2 items-center ml-20">
        <label className="absolute left-0 px-4 py-2 bg-gray-800 rounded">{selectedInstrument}</label>
        <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded ml-4">X</button>
        <button onClick={() => toggleMode('draw')} className={`px-4 py-2 rounded ${mode === 'draw' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}><ImPencil size={20} /></button>
        <button onClick={() => toggleMode('paint')} className={`px-4 py-2 rounded ${mode === 'paint' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}><HiPaintBrush size={20} /></button>
        <button onClick={() => toggleMode('resize')} className={`px-4 py-2 rounded ${mode === 'resize' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}><RxWidth size={20} /></button>
        <button onClick={clearAll} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"><MdOutlineDeleteOutline size={20} /></button>
        <input type="range" min={8} max={128} value={COLS} step={4} onChange={(e) => setCols(Number(e.target.value))} className="w-20" />
      </div>

      <div className="flex">
        <div className="flex flex-col flex-shrink-0 mt-6">
          {noteLabelsRef.current.map((label, i) => (
            <button
              key={i}
              className={`w-15 h-5 border-gray-600 flex items-center justify-end ${isBlackKey(i) ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => handlePlaySound(null, i)}
              style={{ height: `${CELL_HEIGHT}px` }}
            >{label}</button>
          ))}
        </div>

        <div className="relative">
          <div className="flex border-b border-gray-600 bg-gray-800">{topBarMeasureLabels}</div>
          <div
            ref={gridRef}
            className="relative cursor-crosshair select-none"
            onClick={handleGridClick}
            style={{ width: `${COLS * CELL_WIDTH}px`, height: `${ROWS * CELL_HEIGHT}px` }}
          >
            <div className="absolute bg-red-900 pointer-events-none z-10 transition-all duration-10" style={{ left: `${currentStep * CELL_WIDTH}px`, width: `${CELL_WIDTH / 8}px`, height: `${ROWS * CELL_HEIGHT}px` }} />
            {Array.from({ length: ROWS }).map((_, row) =>
              Array.from({ length: COLS }).map((_, col) => (
                <div key={`cell-${row}-${col}`} className="absolute" style={{ top: `${row * CELL_HEIGHT}px`, left: `${col * CELL_WIDTH}px`, width: `${CELL_WIDTH}px`, height: `${CELL_HEIGHT}px` }} onMouseEnter={() => handlePaintCell(row, col)} />
              ))
            )}
            <div className="absolute inset-0 pointer-events-none">
              {horizontalGridLines}
              {verticalGridLines}
            </div>
            {currentNotes.map((note) => (
              <div
                key={note.id}
                className={`absolute rounded border-2 cursor-grab ${selectedNoteId === note.id ? 'bg-red-800 border-red-800 shadow-md' : 'bg-blue-600 border-blue-400 hover:bg-blue-500'}`}
                style={{ left: `${note.start * CELL_WIDTH}px`, top: `${note.row * CELL_HEIGHT}px`, width: `${note.length * CELL_WIDTH}px`, height: `${note.height * CELL_HEIGHT}px` }}
                onMouseDown={(e) => handleNoteMouseDown(e, note)}
              >
                <div className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80" onMouseDown={(e) => handleNoteMouseDown(e, note, 'left')} />
                <div className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300 bg-opacity-50 hover:bg-opacity-80" onMouseDown={(e) => handleNoteMouseDown(e, note, 'right')} />
                <div className="absolute inset-2 flex items-center justify-center text-xs font-semibold text-white">{noteLabelsRef.current[note.row]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PianoRoll;