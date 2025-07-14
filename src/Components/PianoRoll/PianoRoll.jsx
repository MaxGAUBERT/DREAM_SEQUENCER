import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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

const PianoRoll = ({ selectedPatternID, selectedInstrument, instrumentList, setInstrumentList, onOpen, onClose }) => {
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
  const [selectedChordType, setSelectedChordType] = useState('major');
  const { generateChordNotes, playChord } = useChordGenerator({
    ROWS,
    selectedChordType,
    noteLabelsRef,
  });
  const {getSampler, getSynth} = useSampleContext();
  const { isPlaying, playMode } = usePlayContext();
  const playModeRef = useRef(playMode);
  const COLS = cols;

  const currentNotes = useMemo(() =>
    instrumentList[selectedInstrument]?.pianoData?.[selectedPatternID] || [],
    [instrumentList, selectedInstrument, selectedPatternID]
  );

  const toggleMode = (newMode) => {
    setMode((prev) => (prev === newMode ? null : newMode));
    console.log(`Mode changed to ${newMode}`);
  };


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

  const noteLabels = useMemo(() => {
    const labels = Array.from({ length: ROWS }, (_, i) => rowToNoteName(i));
    noteLabelsRef.current = labels;
    return labels;
  }, []);

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

      Object.entries(currentInstrumentList).forEach(([instrumentName, instrument]) => {
      const sampler = getSampler(instrumentName);
      const synth = getSynth(instrumentName);
      const pianoData = instrument?.pianoData?.[currentPatternID] || [];

        if (instrument.muted || currentPlayMode !== 'Pattern') return;

        pianoData.filter(n => n.start === step).forEach(n => {
          const noteName = noteLabelsRef.current[n.row];
          const duration = new Tone.Time("4n").toSeconds() * n.length;
          
          if (!sampler?.loaded && !synth) return;

          sampler?.triggerAttackRelease(noteName, duration, time);
          synth?.triggerAttackRelease(noteName, duration, time);

          console.log(`Playing ${noteName} on ${instrumentName} at time: ${time}`);
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
  }, [isPlaying, COLS, instrumentList]);

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
    //const noteLabel = noteLabelsRef.current[row];
    const noteLabel = rowToNoteName(row);
    const sampler = getSampler(selectedInstrument);
    const synth = getSynth(selectedInstrument);
    if (sampler?.loaded) {
    sampler.triggerAttackRelease(noteLabel, "8n");
  } 
  if (synth /*&& typeof synth.triggerAttackRelease === 'function'*/) {
    try {
      synth.triggerAttackRelease(noteLabel, "8n");
    } catch (err) {
      console.error(`Synth playback error for ${instrumentName}:`, err);
    }
  } else {
    console.warn(`No instrument found for ${selectedInstrument}}`);
  }
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

    if (mode === 'chords') {
      const newChordNotes = generateChordNotes(row, col);
      handleSetNotes(prev => [...prev, ...newChordNotes]);
      handlePlaySound(null, row);
    }

   }, [isResizing, mode, COLS, handleSetNotes]);

  const handleNoteMouseDown = useCallback((e, note, direction = null) => {
    e.stopPropagation();
    setSelectedNoteId(note.id);
    if (direction) {
      setIsResizing(true);
      setResizeDirection(direction);
      setMode('resize');
      console.log(`Resizing ${note.id} ${direction}`);
    }
  }, [isResizing, selectedNoteId, resizeDirection]);

  const handleMouseMove = useCallback((e) => {
  if (!isResizing || !selectedNoteId || mode !== 'resize') return;

  const rect = gridRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const col = Math.floor(x / CELL_WIDTH);

  handleSetNotes((prevNotes) => {
    return prevNotes.map((note) => {
      if (note.id !== selectedNoteId) return note;

      const maxCol = COLS - 1;

      if (resizeDirection === 'left') {
        const newStart = Math.max(0, Math.min(col, note.start + note.length - 1));
        const newLength = note.start + note.length - newStart;

        // Évite une note de longueur 0 ou négative
        if (newLength < 1) return note;

        return {
          ...note,
          start: newStart,
          length: newLength,
        };
      }

      if (resizeDirection === 'right') {
        const rawLength = col - note.start + 1;
        const newLength = Math.max(1, Math.min(rawLength, COLS - note.start));

        return {
          ...note,
          length: newLength,
        };
      }

      return note;
    });
  });
}, [isResizing, selectedNoteId, resizeDirection, mode, handleSetNotes]);


  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
    if (mode === 'resize') setMode('draw'); 
  }, [handleMouseMove,  isResizing, mode]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

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
      <TopBar
        selectedInstrument={selectedInstrument}
        mode={mode}
        toggleMode={toggleMode}
        clearAll={clearAll}
        selectedChordType={selectedChordType}
        setSelectedChordType={setSelectedChordType}
        COLS={COLS}
        setCols={setCols}
        onClose={onClose}
      />
      <div className="flex">
      <NoteLabels
        noteLabels={noteLabelsRef.current}
        handlePlaySound={handlePlaySound}
        isBlackKey={isBlackKey}
      />

      <div className="relative">
        <div className="flex border-b border-gray-600 bg-gray-800">{topBarMeasureLabels}</div>
        <div
          ref={gridRef}
          className="relative cursor-crosshair select-none"
          onClick={handleGridClick}
          style={{ width: `${COLS * CELL_WIDTH}px`, height: `${ROWS * CELL_HEIGHT}px` }}
        >
          <div className="absolute bg-red-900 pointer-events-none z-10 transition-all duration-10"
              style={{ left: `${currentStep * CELL_WIDTH}px`, width: `${CELL_WIDTH / 8}px`, height: `${ROWS * CELL_HEIGHT}px` }} />

                {currentNotes.map((note) => (
                    <NoteBlock
                      key={note.id}
                      note={note}
                      selected={selectedNoteId === note.id}
                      noteLabel={noteLabelsRef.current[note.row]}
                      onMouseDown={(e, note) => handleNoteMouseDown(e, note, null)}
                      onResizeLeft={(e, note) => handleNoteMouseDown(e, note, 'left')}
                      onResizeRight={(e, note) => handleNoteMouseDown(e, note, 'right')}
                    />
                  ))}

                  {Array.from({ length: ROWS }).map((_, row) =>
                    Array.from({ length: COLS }).map((_, col) => (
                      <div key={`cell-${row}-${col}`} className="absolute"
                          style={{
                            top: `${row * CELL_HEIGHT}px`,
                            left: `${col * CELL_WIDTH}px`,
                            width: `${CELL_WIDTH}px`,
                            height: `${CELL_HEIGHT}px`
                          }}
                          onMouseEnter={() => handlePaintCell(row, col)} />
                    ))
                  )}

                    <div className="absolute inset-0 pointer-events-none">
                      {horizontalGridLines}
                      {verticalGridLines}
                    </div>
                  </div>
                </div>
              </div>
              
                </div>
            );
};



export default PianoRoll;




  