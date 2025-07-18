import React, { useState, useRef, useCallback, useEffect, useMemo, useReducer } from 'react';
import * as Tone from 'tone';
import { usePlayContext } from '../../Contexts/PlayContext';
import { TopBar } from './TopBar';
import { NoteBlock } from './NoteBlock';
import { NoteLabels } from './NoteLabels';
import { useChordGenerator } from '../../Hooks/useChordGenerator';
import { rowToNoteName } from '../Utils/noteUtils';
import { useSampleContext } from '../../Contexts/ChannelProvider';

export const ROWS = 48;
export const CELL_WIDTH = 20;
export const CELL_HEIGHT = 20;
export const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const initialState = {
  mode: 'draw',
  selectedNoteId: null,
  isMouseDown: false,
  isResizing: false,
  resizeDirection: null,
  cols: 16
};

function pianoRollReducer(state, action) {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_SELECTED_NOTE_ID":
      return { ...state, selectedNoteId: action.id };
    case "SET_IS_MOUSE_DOWN":
      return { ...state, isMouseDown: action.value };
    case "SET_IS_RESIZING":
      return { ...state, isResizing: action.value };
    case "SET_RESIZE_DIRECTION":
      return { ...state, resizeDirection: action.value };
    case "SET_COLS":
      return { ...state, cols: action.value };
    default:
      return state;
  }
}

// Composant GridLines mémorisé pour éviter les recalculs
const GridLines = React.memo(({ rows, cols, cellWidth, cellHeight }) => {
  const horizontalLines = useMemo(() =>
    Array.from({ length: rows + 1 }, (_, i) => (
      <div 
        key={`h-${i}`} 
        className={`absolute border-t ${i % 12 === 0 ? 'border-gray-500' : 'border-gray-700'}`} 
        style={{ top: `${i * cellHeight}px`, width: '100%' }} 
      />
    )), [rows, cellHeight]
  );

  const verticalLines = useMemo(() =>
    Array.from({ length: cols + 1 }, (_, i) => (
      <div 
        key={`v-${i}`} 
        className={`absolute border-l ${i % 4 === 0 ? 'border-gray-500' : 'border-gray-700'}`} 
        style={{ left: `${i * cellWidth}px`, height: '100%' }} 
      />
    )), [cols, cellWidth]
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {horizontalLines}
      {verticalLines}
    </div>
  );
});

// Composant CellGrid optimisé avec virtualisation pour les grandes grilles
const CellGrid = React.memo(({ rows, cols, cellWidth, cellHeight, onCellMouseEnter }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => (
          <div 
            key={`cell-${row}-${col}`} 
            className="absolute"
            style={{
              top: `${row * cellHeight}px`,
              left: `${col * cellWidth}px`,
              width: `${cellWidth}px`,
              height: `${cellHeight}px`
            }}
            onMouseEnter={() => onCellMouseEnter(row, col)} 
          />
        ))
      )}
    </>
  );
});

const PianoRoll = ({ 
  selectedPatternID, 
  selectedInstrument, 
  instrumentList, 
  setInstrumentList, 
  onOpen, 
  onClose 
}) => {
  const [state, dispatch] = useReducer(pianoRollReducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChordType, setSelectedChordType] = useState("major");
  
  // Refs pour éviter les re-renders
  const gridRef = useRef(null);
  const loopRef = useRef(null);
  const stepRef = useRef(0);
  const modeRef = useRef(state.mode);
  const instrumentListRef = useRef(instrumentList);
  const selectedPatternIDRef = useRef(selectedPatternID);
  const noteLabelsRef = useRef([]);
  const playModeRef = useRef();
  
  // Hooks
  const { generateChordNotes, playChord } = useChordGenerator({
    ROWS, 
    selectedChordType, 
    noteLabelsRef
  });
  const { getSampler, getSynth } = useSampleContext();
  const { isPlaying, playMode } = usePlayContext();

  const COLS = state.cols;

  // Memoized values
  const currentNotes = useMemo(() =>
    instrumentList[selectedInstrument]?.pianoData?.[selectedPatternID] || [],
    [instrumentList, selectedInstrument, selectedPatternID]
  );

  const topBarMeasureLabels = useMemo(() =>
    Array.from({ length: COLS / 4 }, (_, i) => (
      <div 
        key={i} 
        className="border-r border-gray-600 text-center text-xs py-1 text-gray-300" 
        style={{ width: `${CELL_WIDTH * 4}px` }}
      >
        {i + 1}
      </div>
    )), [COLS]
  );

  const noteLabels = useMemo(() => {
    const labels = Array.from({ length: ROWS }, (_, i) => rowToNoteName(i));
    noteLabelsRef.current = labels;
    return labels;
  }, []);

  const isBlackKey = useCallback((row) => 
    [1, 3, 6, 8, 10].includes((ROWS - 1 - row) % 12), []
  );

  // Sync refs with state
  useEffect(() => { modeRef.current = state.mode; }, [state.mode]);
  useEffect(() => { instrumentListRef.current = instrumentList; }, [instrumentList]);
  useEffect(() => { selectedPatternIDRef.current = selectedPatternID; }, [selectedPatternID]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);

  // Optimized note update function
  const handleSetNotes = useCallback((updater) => {
    setInstrumentList(prev => {
      const instrument = prev[selectedInstrument];
      if (!instrument) return prev;
      
      const current = instrument.pianoData?.[selectedPatternID] || [];
      const updatedNotes = typeof updater === 'function' ? updater(current) : updater;

      return {
        ...prev,
        [selectedInstrument]: {
          ...instrument,
          pianoData: {
            ...instrument.pianoData,
            [selectedPatternID]: updatedNotes,
          },
        },
      };
    });
  }, [selectedInstrument, selectedPatternID, setInstrumentList]);

  // Optimized sound playing
  const handlePlaySound = useCallback(async (_, row) => {
    await Tone.start();
    const noteLabel = rowToNoteName(row);
    const sampler = getSampler(selectedInstrument);
    const synth = getSynth(selectedInstrument);
    
    try {
      if (sampler?.loaded) {
        sampler.triggerAttackRelease(noteLabel, "8n");
      }
      if (synth) {
        synth.triggerAttackRelease(noteLabel, "8n");
      }
    } catch (err) {
      console.error(`Audio playback error for ${selectedInstrument}:`, err);
    }
  }, [selectedInstrument, getSampler, getSynth]);

  // Optimized grid click handler
  const handleGridClick = useCallback((e) => {
    if (state.isResizing) return;
    
    const currentMode = modeRef.current;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL_WIDTH);
    const row = Math.floor(y / CELL_HEIGHT);
    
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    if (currentMode === 'draw') {
      handlePlaySound(null, row);
      handleSetNotes((prev) => {
        const existingIndex = prev.findIndex(n => 
          row >= n.row && row < n.row + n.height && 
          col >= n.start && col < n.start + n.length
        );
        
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated.splice(existingIndex, 1);
          dispatch({ type: 'SET_SELECTED_NOTE_ID', id: null });
          return updated;
        } else {
          const newNote = { 
            id: crypto.randomUUID(), 
            row, 
            start: col, 
            length: 2, 
            height: 1, 
            pitch: ROWS - 1 - row 
          };
          dispatch({ type: 'SET_SELECTED_NOTE_ID', id: newNote.id });
          return [...prev, newNote];
        }
      });
    }

    if (currentMode === 'chords') {
      const newChordNotes = generateChordNotes(row, col);
      if (newChordNotes.length > 0) {
        handleSetNotes(prev => [...prev, ...newChordNotes]);
        dispatch({ type: 'SET_SELECTED_NOTE_ID', id: newChordNotes[0].id });
      }
      handlePlaySound(null, row);
    }
  }, [state.isResizing, handleSetNotes, handlePlaySound, generateChordNotes, COLS]);

  // Optimized mouse handlers
  const handleNoteMouseDown = useCallback((e, note, direction = null) => {
    e.stopPropagation();
    dispatch({ type: 'SET_SELECTED_NOTE_ID', id: note.id });
    
    if (direction) {
      dispatch({ type: 'SET_MODE', mode: 'resize' });
      dispatch({ type: 'SET_RESIZE_DIRECTION', value: direction });
      dispatch({ type: 'SET_IS_RESIZING', value: true });
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!state.isResizing || !state.selectedNoteId || modeRef.current !== 'resize') return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor(x / CELL_WIDTH);

    handleSetNotes((prevNotes) => {
      return prevNotes.map((note) => {
        if (note.id !== state.selectedNoteId) return note;

        if (state.resizeDirection === 'left') {
          const newStart = Math.max(0, Math.min(col, note.start + note.length - 1));
          const newLength = note.start + note.length - newStart;
          
          if (newLength < 1) return note;
          
          return { ...note, start: newStart, length: newLength };
        }

        if (state.resizeDirection === 'right') {
          const rawLength = col - note.start + 1;
          const newLength = Math.max(1, Math.min(rawLength, COLS - note.start));
          
          return { ...note, length: newLength };
        }

        return note;
      });
    });
  }, [state.isResizing, state.selectedNoteId, state.resizeDirection, handleSetNotes, COLS]);

  const handleMouseUp = useCallback(() => {
    dispatch({ type: 'SET_IS_RESIZING', value: false });
    dispatch({ type: 'SET_RESIZE_DIRECTION', value: null });
    if (modeRef.current === 'resize') {
      dispatch({ type: "SET_MODE", mode: "draw" });
    }
  }, []);

  // Optimized paint cell handler
  const handlePaintCell = useCallback((row, col) => {
    if (!state.isMouseDown || modeRef.current !== 'paint') return;
    
    handleSetNotes(prev => {
      const exists = prev.some(n => 
        n.row === row && col >= n.start && col < n.start + n.length
      );
      if (exists) return prev;
      
      return [...prev, { 
        id: crypto.randomUUID(), 
        row, 
        start: col, 
        length: 2, 
        height: 1, 
        pitch: ROWS - 1 - row 
      }];
    });
  }, [state.isMouseDown, handleSetNotes]);

  // Optimized clear function
  const clearAll = useCallback(() => {
    handleSetNotes([]);
    dispatch({ type: 'SET_SELECTED_NOTE_ID', id: null });
  }, [handleSetNotes]);

  // Mode toggle function
  const toggleMode = useCallback((newMode) => {
    dispatch({ type: "SET_MODE", mode: newMode });
  }, []);

  // Event listeners setup
  useEffect(() => {
    if (state.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [state.isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleMouseDown = () => dispatch({ type: 'SET_IS_MOUSE_DOWN', value: true });
    const handleMouseUpGlobal = () => dispatch({ type: 'SET_IS_MOUSE_DOWN', value: false });
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || loopRef.current) return;

    loopRef.current = new Tone.Loop((time) => {
      const step = stepRef.current;
      setCurrentStep(step);

      const currentInstrumentList = instrumentListRef.current;
      const currentPatternID = selectedPatternIDRef.current;
      const currentPlayMode = playModeRef.current;

      Object.entries(currentInstrumentList).forEach(([instrumentName, instrument]) => {
        if (instrument.muted || currentPlayMode !== 'Pattern') return;

        const sampler = getSampler(instrumentName);
        const synth = getSynth(instrumentName);
        const pianoData = instrument?.pianoData?.[currentPatternID] || [];

        pianoData
          .filter(n => n.start === step)
          .forEach(n => {
            const noteName = noteLabelsRef.current[n.row];
            const duration = new Tone.Time("4n").toSeconds() * n.length;
            
            try {
              if (sampler?.loaded) {
                sampler.triggerAttackRelease(noteName, duration, time);
              }
              if (synth) {
                synth.triggerAttackRelease(noteName, duration, time);
              }
            } catch (err) {
              console.error(`Playback error for ${instrumentName}:`, err);
            }
          });
      });

      stepRef.current = (step + 1) % COLS;
    }, "16n");

    loopRef.current.start(0);
    Tone.Transport.start();

    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setCurrentStep(0);
      stepRef.current = 0;
    };
  }, [isPlaying, COLS, getSampler, getSynth]);

  return (
    <div 
      ref={onOpen} 
      className="w-screen h-140 fixed bg-gray-900 text-white border-2 border-white p-3 overflow-auto resize"
    >
      <TopBar
        selectedInstrument={selectedInstrument}
        mode={state.mode}
        toggleMode={toggleMode}
        clearAll={clearAll}
        selectedChordType={selectedChordType}
        setSelectedChordType={setSelectedChordType}
        COLS={COLS}
        setCols={(value) => dispatch({ type: 'SET_COLS', value })}
        onClose={onClose}
      />
      
      <div className="flex">
        <NoteLabels
          noteLabels={noteLabels}
          handlePlaySound={handlePlaySound}
          isBlackKey={isBlackKey}
        />
        
        <div className="relative">
          <div className="flex border-b border-gray-600 bg-gray-800">
            {topBarMeasureLabels}
          </div>
          
          <div
            ref={gridRef}
            className="relative cursor-crosshair select-none"
            onClick={handleGridClick}
            style={{ 
              width: `${COLS * CELL_WIDTH}px`, 
              height: `${ROWS * CELL_HEIGHT}px` 
            }}
          >
            {/* Playhead */}
            <div 
              className="absolute bg-red-900 pointer-events-none z-10 transition-all duration-10"
              style={{ 
                left: `${currentStep * CELL_WIDTH}px`, 
                width: `${CELL_WIDTH / 8}px`, 
                height: `${ROWS * CELL_HEIGHT}px` 
              }} 
            />

            {/* Notes */}
            {currentNotes.map((note) => (
              <NoteBlock
                key={note.id}
                note={note}
                selected={state.selectedNoteId === note.id}
                noteLabel={noteLabelsRef.current[note.row]}
                onMouseDown={(e) => handleNoteMouseDown(e, note, null)}
                onResizeLeft={(e) => handleNoteMouseDown(e, note, 'left')}
                onResizeRight={(e) => handleNoteMouseDown(e, note, 'right')}
              />
            ))}

            {/* Cell Grid */}
            <CellGrid
              rows={ROWS}
              cols={COLS}
              cellWidth={CELL_WIDTH}
              cellHeight={CELL_HEIGHT}
              onCellMouseEnter={handlePaintCell}
            />

            {/* Grid Lines */}
            <GridLines
              rows={ROWS}
              cols={COLS}
              cellWidth={CELL_WIDTH}
              cellHeight={CELL_HEIGHT}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;