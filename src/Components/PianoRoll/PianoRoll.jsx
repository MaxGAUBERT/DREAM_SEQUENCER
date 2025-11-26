import React, { useState, useRef, useCallback, useEffect, useMemo, useReducer } from 'react'; 
import * as Tone from 'tone';
import { usePlayContext } from '../../Contexts/PlayContext';
import { TopBar } from './TopBar';
import { NoteBlock } from './NoteBlock';
import { NoteLabels } from './NoteLabels';
import { useChordGenerator } from '../../Hooks/useChordGenerator';
import { rowToNoteName } from '../Utils/noteUtils';
import { useSampleContext } from '../../Contexts/ChannelProvider';
import { useHistoryContext } from '../../Contexts/HistoryProvider';
// === AJOUT
import ZoomBarTW from '../../UI/ZoomBarTW';

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
  cols: 32
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

// GridLines
const GridLines = React.memo(({ rows, cols, cellWidth, cellHeight }) => {
  const horizontalLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= rows; i++) {
      lines.push(
        <div 
          key={i} 
          className={`absolute border-t ${i % 12 === 0 ? 'border-gray-500' : 'border-gray-700'}`} 
          style={{ top: `${i * cellHeight}px`, width: '100%', transform: 'translateZ(0)' }} 
        />
      );
    }
    return lines;
  }, [rows, cellHeight]);

  const verticalLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= cols; i++) {
      lines.push(
        <div 
          key={i} 
          className={`absolute border-l ${i % 4 === 0 ? 'border-gray-500' : 'border-gray-700'}`} 
          style={{ left: `${i * cellWidth}px`, height: '100%', transform: 'translateZ(0)' }} 
        />
      );
    }
    return lines;
  }, [cols, cellWidth]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }}>
      {horizontalLines}
      {verticalLines}
    </div>
  );
});

// Grille interactive — convertit x viewport -> x contenu via xToContent
const VirtualizedCellGrid = React.memo(({ rows, cols, cellWidth, cellHeight, onCellMouseEnter, xToContent }) => {
  const handleMouseEnter = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xView = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xContent = xToContent(xView);
    const col = Math.floor(xContent / cellWidth);
    const row = Math.floor(y / cellHeight);
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      onCellMouseEnter(row, col);
    }
  }, [rows, cols, cellWidth, cellHeight, onCellMouseEnter, xToContent]);

  return (
    <div 
      className="absolute inset-0"
      style={{
        width: `${cols * cellWidth}px`,
        height: `${rows * cellHeight}px`,
        willChange: 'transform'
      }}
      onMouseMove={handleMouseEnter}
    />
  );
});

// Labels mesures
const MeasureLabels = React.memo(({ cols, cellWidth }) => {
  const labels = useMemo(() => {
    const measureCount = Math.ceil(cols / 4);
    const elements = [];
    for (let i = 0; i < measureCount; i++) {
      elements.push(
        <div 
          key={i} 
          className="border-r border-gray-600 text-center text-xs py-1 text-gray-300" 
          style={{ width: `${cellWidth * 4}px`, transform: 'translateZ(0)' }}
        >
          {i + 1}
        </div>
      );
    }
    return elements;
  }, [cols, cellWidth]);

  return <div className="flex border-b border-gray-600 bg-gray-800">{labels}</div>;
});

const PianoRoll = ({ 
  selectedPatternID, 
  selectedInstrument, 
  instrumentList, 
  setInstrumentList,
  onOpen,
  onClose,
  numSteps,
  setNumSteps
}) => {
  const [state, dispatch] = useReducer(pianoRollReducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChordType, setSelectedChordType] = useState("major");
  const {dispatchAction} = useHistoryContext();

  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState(null); 
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialNote, setInitialNote] = useState(null);
  
  // Refs
  const gridRef = useRef(null);
  const viewportRef = useRef(null);
  const loopRef = useRef(null);
  const stepRef = useRef(0);
  const modeRef = useRef(state.mode);
  const instrumentListRef = useRef(instrumentList);
  const selectedPatternIDRef = useRef(selectedPatternID);
  const noteLabelsRef = useRef([]);
  const playModeRef = useRef();
  //const {numSteps, setNumSteps} = useProjectManager();
  
  // Hooks
  const { generateChordNotes } = useChordGenerator({
    ROWS, 
    selectedChordType, 
    noteLabelsRef
  });
  const { getSampler, getSynth } = useSampleContext();
  const { isPlaying, playMode } = usePlayContext();

  const COLS = numSteps;

  // ====== ZOOM / PAN ======
  const [windowRange, setWindowRange] = useState([0, 20]); // [%, %]
  const minWindowPercent = 2;
  const naturalWidthPx = COLS * CELL_WIDTH;            // largeur "contenu" sans transform
  const windowWidthPercent = windowRange[1] - windowRange[0];
  const scaleX = 100 / windowWidthPercent;             // ex: fenêtre 20% -> scaleX 5
  const startPx = (windowRange[0] / 100) * naturalWidthPx;

  // convertit coord x de la vue -> coord x du contenu (avant transform)
  const xToContent = useCallback((xView) => xView / scaleX + startPx, [scaleX, startPx]);

  // Ctrl + molette pour zoomer dans le viewport principal
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = vp.getBoundingClientRect();
      const xView = e.clientX - rect.left;
      const xContent = xToContent(xView);
      const cursorPercent = (xContent / naturalWidthPx) * 100;

      const delta = Math.sign(e.deltaY);
      const factor = 1 + 0.15 * Math.abs(delta);
      const currentWidth = windowRange[1] - windowRange[0];
      const newWidth = delta > 0 ? currentWidth * factor : currentWidth / factor;
      const clampedWidth = Math.max(minWindowPercent, Math.min(100, newWidth));

      const startToCursor = cursorPercent - windowRange[0];
      const ratio = startToCursor / currentWidth;
      let newStart = cursorPercent - ratio * clampedWidth;
      let newEnd = newStart + clampedWidth;

      if (newStart < 0) { newStart = 0; newEnd = clampedWidth; }
      if (newEnd > 100) { newEnd = 100; newStart = 100 - clampedWidth; }
      setWindowRange([newStart, newEnd]);
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [xToContent, windowRange, naturalWidthPx]);
  // ========================

  const currentNotes = useMemo(() =>
    instrumentList[selectedInstrument]?.pianoData?.[selectedPatternID] || [],
    [instrumentList, selectedInstrument, selectedPatternID]
  );

  const noteLabels = useMemo(() => {
    const labels = Array.from({ length: ROWS }, (_, i) => rowToNoteName(i));
    noteLabelsRef.current = labels;
    return labels;
  }, []);

  const isBlackKey = useCallback((row) => 
    [1, 3, 6, 8, 10].includes((ROWS - 1 - row) % 12), []
  );

  useEffect(() => { modeRef.current = state.mode; }, [state.mode]);
  useEffect(() => { instrumentListRef.current = instrumentList; }, [instrumentList]);
  useEffect(() => { selectedPatternIDRef.current = selectedPatternID; }, [selectedPatternID]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);

  const handleColsChange = useCallback((newCols) => {
    requestAnimationFrame(() => {
      dispatch({ type: 'SET_COLS', value: newCols });
      setNumSteps(newCols);
      setInstrumentList(prev => {
        const instrument = prev[selectedInstrument];
        if (!instrument) return prev;

        const pianoData = instrument.pianoData?.[selectedPatternID] || [];
        const filteredNotes = pianoData.filter(note => note.start < newCols);

        return {
          ...prev,
          [selectedInstrument]: {
            ...instrument,
            pianoData: {
              ...instrument.pianoData,
              [selectedPatternID]: filteredNotes
            }
          }
        };
      });

      // Réinitialise la fenêtre sur une proportion simple
      setWindowRange(([s, e]) => {
        const width = Math.max(minWindowPercent, e - s);
        return [0, Math.min(100, width)];
      });
    });
  }, [selectedInstrument, selectedPatternID, setInstrumentList, setNumSteps]);

  const handleResizeLeft = useCallback((e, note) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode('left');
    setInitialMouseX(e.clientX);
    setInitialNote({ ...note });
    dispatch({ type: 'SET_SELECTED_NOTE_ID', id: note.id });
  }, []);

  const handleResizeRight = useCallback((e, note) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode('right');
    setInitialMouseX(e.clientX);
    setInitialNote({ ...note });
    dispatch({ type: 'SET_SELECTED_NOTE_ID', id: note.id });
  }, []);

  const handleSetNotes = useCallback((updater) => {
    let prevNotes = [];
    let nextNotes = [];

    setInstrumentList(prev => {
      const inst = prev[selectedInstrument];
      if (!inst) return prev;

      prevNotes = inst.pianoData?.[selectedPatternID] ?? [];
      nextNotes = (typeof updater === 'function') ? updater(prevNotes) : updater;

      const same =
        prevNotes === nextNotes ||
        (Array.isArray(prevNotes) && Array.isArray(nextNotes) &&
         prevNotes.length === nextNotes.length &&
         prevNotes.every((v, i) => v === nextNotes[i]));
      if (same) return prev;

      return {
        ...prev,
        [selectedInstrument]: {
          ...inst,
          pianoData: {
            ...inst.pianoData,
            [selectedPatternID]: nextNotes,
          },
        },
      };
    });

    dispatchAction({
      type: 'setNotes',
      payload: { selectedInstrument, selectedPatternID },
      apply: () => {
        setInstrumentList(prev => {
          const inst = prev[selectedInstrument];
          if (!inst) return prev;
          return {
            ...prev,
            [selectedInstrument]: {
              ...inst,
              pianoData: {
                ...inst.pianoData,
                [selectedPatternID]: nextNotes,
              },
            },
          };
        });
      },
      revert: () => {
        setInstrumentList(prev => {
          const inst = prev[selectedInstrument];
          if (!inst) return prev;
          return {
            ...prev,
            [selectedInstrument]: {
              ...inst,
              pianoData: {
                ...inst.pianoData,
                [selectedPatternID]: prevNotes,
              },
            },
          };
        });
      }
    });
  }, [selectedInstrument, selectedPatternID, setInstrumentList, dispatchAction]);

  const handlePlaySound = useCallback(async (_, row) => {
    await Tone.start();
    const noteLabel = rowToNoteName(row);
    const sampler = getSampler(selectedInstrument);
    try {
      if (sampler?.loaded) {
        sampler.triggerAttackRelease(noteLabel, "8n");
      }
    } catch (err) {
      console.error(`Audio playback error for ${selectedInstrument}:`, err);
    }
  }, [selectedInstrument, getSampler, getSynth]);

  const handleDeleteCell = useCallback((row, col) => {
    if (!state.isMouseDown || modeRef.current !== 'delete') return;

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
        return prev;
      }
    });
  }, [state.isMouseDown, handleSetNotes]);

  const handleGridClick = useCallback((e) => {
    if (state.isResizing) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const xView = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xContent = xToContent(xView);
    const col = Math.floor(xContent / CELL_WIDTH);
    const row = Math.floor(y / CELL_HEIGHT);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    const currentMode = state.mode;

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

    if (currentMode === 'resize') {
      const noteUnderCursor = instrumentList[selectedInstrument]?.pianoData?.[selectedPatternID]
        ?.find(n =>
          row >= n.row &&
          row < n.row + n.height &&
          col >= n.start &&
          col < n.start + n.length
        );

      if (noteUnderCursor) {
        dispatch({ type: 'SET_SELECTED_NOTE_ID', id: noteUnderCursor.id });

        const gridRect = gridRef.current.getBoundingClientRect();
        const noteLeft = noteUnderCursor.start * CELL_WIDTH;
        const noteRight = noteLeft + noteUnderCursor.length * CELL_WIDTH;

        const clickXContent = xToContent(e.clientX - gridRect.left);
        const clickRelX = clickXContent - noteLeft;
        const direction = clickRelX < (noteRight - noteLeft) / 2 ? 'left' : 'right';

        dispatch({ type: 'SET_IS_RESIZING', value: true });
        dispatch({ type: 'SET_RESIZE_DIRECTION', value: direction });

        setIsResizing(true);
        setResizeMode(direction);
        setInitialNote(noteUnderCursor);
        setInitialMouseX(e.clientX);
      } else {
        dispatch({ type: 'SET_SELECTED_NOTE_ID', id: null });
      }
    }

    if (currentMode === 'chords') {
      const newChordNotes = generateChordNotes(row, col);
      if (newChordNotes.length > 0) {
        handleSetNotes(prev => [...prev, ...newChordNotes]);
        dispatch({ type: 'SET_SELECTED_NOTE_ID', id: newChordNotes[0].id });
      }
      handlePlaySound(null, row);
    }
  }, [state.isResizing, state.mode, handleSetNotes, handlePlaySound, generateChordNotes, COLS, xToContent]);

  const handleNoteMouseDown = useCallback((e, note, direction = null) => {
    e.stopPropagation();
    dispatch({ type: 'SET_SELECTED_NOTE_ID', id: note.id });
    if (direction) {
      dispatch({ type: 'SET_RESIZE_DIRECTION', value: direction });
      dispatch({ type: 'SET_IS_RESIZING', value: true });
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    // Resize en mode "drag des poignées" local
    if (isResizing && initialNote) {
      const deltaXView = e.clientX - initialMouseX;
      const deltaXContent = deltaXView / scaleX;
      const deltaCells = Math.round(deltaXContent / CELL_WIDTH);
      
      handleSetNotes(prevNotes => {
        return prevNotes.map(note => {
          if (note.id !== initialNote.id) return note;
          
          if (resizeMode === 'left') {
            const maxDelta = initialNote.length - 1;
            const actualDelta = Math.max(-initialNote.start, Math.min(deltaCells, maxDelta));
            return {
              ...note,
              start: initialNote.start + actualDelta,
              length: initialNote.length - actualDelta
            };
          } else if (resizeMode === 'right') {
            const maxLength = COLS - initialNote.start;
            const newLength = Math.max(1, Math.min(initialNote.length + deltaCells, maxLength));
            return { ...note, length: newLength };
          }
          return note;
        });
      });
      return;
    }

    // Resize via mode "resize"
    if (!state.isResizing || !state.selectedNoteId) return;

    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const xView = e.clientX - rect.left;
    const xContent = xToContent(xView);
    const col = Math.floor(xContent / CELL_WIDTH);

    handleSetNotes((prevNotes) => {
      return prevNotes.map((note) => {
        if (note.id !== state.selectedNoteId) return note;

        if (state.resizeDirection === 'left') {
          const maxStart = note.start + note.length - 1;
          const newStart = Math.max(0, Math.min(col, maxStart));
          const newLength = note.start + note.length - newStart;
          if (newLength >= 1) {
            return { ...note, start: newStart, length: newLength };
          }
        }

        if (state.resizeDirection === 'right') {
          const minLength = 1;
          const maxLength = COLS - note.start;
          const newLength = Math.max(minLength, Math.min(col - note.start + 1, maxLength));
          return { ...note, length: newLength };
        }
        return note;
      });
    });
  }, [state.isResizing, state.selectedNoteId, state.resizeDirection, COLS, handleSetNotes, isResizing, initialNote, initialMouseX, resizeMode, scaleX, xToContent]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizeMode(null);
      setInitialNote(null);
      setInitialMouseX(0);
      dispatch({ type: 'SET_IS_RESIZING', value: false });
      dispatch({ type: 'SET_RESIZE_DIRECTION', value: null });
    }
  }, [isResizing, dispatch]);

  const paintThrottleRef = useRef(null);
  const handlePaintCell = useCallback((row, col) => {
    if (!state.isMouseDown || modeRef.current !== 'paint') return;
    if (paintThrottleRef.current) return;
    paintThrottleRef.current = setTimeout(() => { paintThrottleRef.current = null; }, 16);
    
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

  const clearAll = useCallback(() => {
    handleSetNotes([]); dispatch({ type: 'SET_SELECTED_NOTE_ID', id: null });
  }, [handleSetNotes]);

  const toggleMode = useCallback((newMode) => {
    dispatch({ type: "SET_MODE", mode: newMode });
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

  // === RENDER
  return (
    <div className="bg-gray-900 text-white rounded-xl min-h-0">
      <TopBar
        selectedInstrument={selectedInstrument}
        mode={state.mode}
        toggleMode={toggleMode}
        clearAll={clearAll}
        selectedChordType={selectedChordType}
        setSelectedChordType={setSelectedChordType}
        numSteps={COLS}
        setNumSteps={handleColsChange}
        onClose={onClose}
      />
        {/* Barre de zoom/pan */}
      <div className="mt-2">
        <ZoomBarTW
          windowRange={windowRange}
          setWindowRange={setWindowRange}
          minWindowPercent={minWindowPercent}
        />
      </div>

      <div className="flex">
        <NoteLabels
          noteLabels={noteLabels}
          handlePlaySound={handlePlaySound}
          isBlackKey={isBlackKey}
        />

        {/* Viewport qui clippe, contenu translaté + scaleX */}
        <div className="relative w-full overflow-hidden" ref={viewportRef}>
          {/* Mesures */}
          <div
            className="relative"
            style={{
              width: `${COLS * CELL_WIDTH}px`,
              transformOrigin: 'left center',
              transform: `translateX(-${startPx}px) scaleX(${scaleX})`,
            }}
          >
            <MeasureLabels cols={COLS} cellWidth={CELL_WIDTH} />
          </div>

          {/* Grille + notes */}
          <div
            ref={gridRef}
            className="relative cursor-crosshair select-none"
            onClick={handleGridClick}
            style={{ 
              width: `${COLS * CELL_WIDTH}px`, 
              height: `${ROWS * CELL_HEIGHT}px`,
              transformOrigin: 'left top',
              transform: `translateX(-${startPx}px) scaleX(${scaleX})`,
              willChange: 'transform'
            }}
          >
            {/* Playhead */}
            <div 
              className="absolute bg-red-900 pointer-events-none z-10"
              style={{ 
                left: `${currentStep * CELL_WIDTH}px`, 
                width: `${CELL_WIDTH / 8}px`, 
                height: `${ROWS * CELL_HEIGHT}px`,
                transform: 'translateZ(0)',
                transition: 'left 0.1s linear'
              }} 
            />

            {/* Notes */}
            <div style={{ willChange: 'transform' }}>
              {currentNotes.map((note) => (
                <NoteBlock
                  key={note.id}
                  note={note}
                  selected={state.selectedNoteId === note.id}
                  noteLabel={noteLabelsRef.current[note.row]}
                  onMouseDown={(e) => handleNoteMouseDown(e, note, null)}
                  onResizeLeft={handleResizeLeft}
                  onResizeRight={handleResizeRight}
                />
              ))}
            </div>

            {/* Grille interactive (convertit x via xToContent) */}
            <VirtualizedCellGrid
              rows={ROWS}
              cols={COLS}
              cellWidth={CELL_WIDTH}
              cellHeight={CELL_HEIGHT}
              onCellMouseEnter={(row, col) => {handlePaintCell(row, col); handleDeleteCell(row, col)}}
              xToContent={xToContent}
            />

            {/* Lignes */}
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

function areEqual(prevProps, nextProps) {
  if (prevProps.onOpen !== nextProps.onOpen) return false;
  if (prevProps.onClose !== nextProps.onClose) return false;
  if (prevProps.instrumentList !== nextProps.instrumentList) return false;
  if (prevProps.setInstrumentList !== nextProps.setInstrumentList) return false;
  if (prevProps.numSteps !== nextProps.numSteps) return false;
  if (prevProps.setNumSteps !== nextProps.setNumSteps) return false;
  return true;
}

export default React.memo(PianoRoll, areEqual);
