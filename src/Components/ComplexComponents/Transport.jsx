import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { FaRegPlayCircle, FaRegStopCircle } from "react-icons/fa";
import { BsFillSignStopFill, BsFillTrashFill, BsFillRecordCircleFill } from "react-icons/bs";
import { FaPauseCircle } from "react-icons/fa";
import { MdReplay, MdRepeat, MdRepeatOne, MdOutlineFastForward, MdOutlineFastRewind } from "react-icons/md";
import { PiRecordBold } from "react-icons/pi";
import { PiPianoKeysFill } from "react-icons/pi";
import { PiPlaylistFill } from "react-icons/pi";
import { itemsToMapForDisplay } from "../Contexts/ItemsToMapForDisplay";

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


const Transport = ({
  stepValue,
  players,
  grids,
  playlist,
  patterns,
  setStepRow,
  onMouseEnter: infos,
  onMouseLeave,
  setIsPlaying: setParentIsPlaying,
  setSongMode: setParentSongMode,
  setCurrentPlaylistRow: setParentCurrentPlaylistRow,
  setCurrentPlaylistCol: setParentCurrentPlaylistCol,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBPM] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSequence, setRecordedSequence] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [playbackTimeouts, setPlaybackTimeouts] = useState([]);
  const [stepRow, setLocalStepRow] = useState(0);
  const [songMode, setSongMode] = useState(false);
  const [currentPlaylistRow, setCurrentPlaylistRow] = useState(0);
  const [currentPlaylistCol, setCurrentPlaylistCol] = useState(0);
  const [loopMode, setLoopMode] = useState("none");
  const [playlistInterval, setPlaylistInterval] = useState(null);

  const pianoNotes = useMemo(() => ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"], []);

  const {items} = itemsToMapForDisplay();

  // Refs
  const gridsRef = useRef(grids);
  const playlistRef = useRef(playlist);
  const patternsRef = useRef(patterns);
  const playersRef = useRef(players);
  const currentPlaylistRowRef = useRef(currentPlaylistRow);
  const currentPlaylistColRef = useRef(currentPlaylistCol);
  const stepRowRef = useRef(stepRow);

  // Sync refs
  useEffect(() => { gridsRef.current = grids; }, [grids]);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => {
    currentPlaylistRowRef.current = currentPlaylistRow;
    setParentCurrentPlaylistRow?.(currentPlaylistRow);
  }, [currentPlaylistRow]);
  useEffect(() => {
    currentPlaylistColRef.current = currentPlaylistCol;
    setParentCurrentPlaylistCol?.(currentPlaylistCol);
  }, [currentPlaylistCol]);
  useEffect(() => { stepRowRef.current = stepRow; }, [stepRow]);
  useEffect(() => { setParentIsPlaying?.(isPlaying); }, [isPlaying]);
  useEffect(() => { setParentSongMode?.(songMode); }, [songMode]);
  useEffect(() => { Tone.Transport.bpm.value = bpm; }, [bpm]);

  const updateStepRow = useCallback((newValueOrUpdater) => {
    const newValue = typeof newValueOrUpdater === "function"
      ? newValueOrUpdater(stepRowRef.current)
      : newValueOrUpdater;

    setLocalStepRow(newValue);
    setStepRow?.(newValue);
  }, [setStepRow]);

  const recordSequence = useCallback((instrument, note, step) => {
    if (!isRecording) return;
    setRecordedSequence(prev => [...prev, { instrument, note, step, time: Date.now() }]);
  }, [isRecording]);

  // Pattern playback
useEffect(() => {
  if (!isPlaying || songMode || !players || Object.keys(players).length === 0) return;

  let eventId;

  const startPlayback = () => {
    // Calculer l'intervalle en notation Tone.js (16th notes pour des steps de 1/4)
    const noteValue = "16n"; // ou ajustez selon votre subdivision souhaitée

    eventId = Tone.Transport.scheduleRepeat((time) => {
      updateStepRow(prevStep => {
        const nextStep = (prevStep + 1) % stepValue;
        const currentGrids = gridsRef.current;

        Object.entries(currentGrids).forEach(([instrument, instrumentGrid]) => {
          instrumentGrid?.forEach((row, noteIndex) => {
            if (row?.[nextStep]) {
              const note = pianoNotes[noteIndex];
              const player = playersRef.current[instrument];
              if (player) {
                player.triggerAttackRelease(note, "4n", time);
                if (isRecording) recordSequence(instrument, note, nextStep);
              }
            }
          });
        });

        return nextStep;
      });
    }, noteValue);
    

    // Définir le BPM et démarrer le transport
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();
  };

  startPlayback();

  return () => {
    if (eventId) {
      Tone.Transport.clear(eventId);
    }
    Tone.Transport.stop();
  };
}, [isPlaying, bpm, songMode, isRecording, stepValue, updateStepRow, recordSequence, pianoNotes]);

  const StopSong = useCallback(() => {
    if (playlistInterval) clearInterval(playlistInterval);
    setPlaylistInterval(null);
    setIsPlaying(false);
    Tone.Transport.stop();
  }, [playlistInterval]);

  const PlaySong = useCallback(() => {
    if (!playersRef.current || Object.keys(playersRef.current).length === 0 || !playlistRef.current) return;

    if (playlistInterval) clearInterval(playlistInterval);

    setCurrentPlaylistRow(0);
    setCurrentPlaylistCol(0);
    updateStepRow(0);

    const intervalTime = (60 / bpm / 4) * 1000;
    let currentStep = 0;

    const interval = setInterval(() => {
      const playlistGrid = playlistRef.current?.initGrid;
      if (!playlistGrid || playlistGrid.length === 0) return;

      const row = currentPlaylistRowRef.current;
      const col = currentPlaylistColRef.current;

      if (row >= playlistGrid.length || col >= playlistGrid[0].length) {
        StopSong();
        return;
      }

      const patternRef = playlistGrid[row]?.[col];
      const pattern = patternsRef.current.find(p => p.id === patternRef?.id);

      if (pattern?.grids) {
        Object.entries(pattern.grids).forEach(([instrument, instrumentGrid]) => {
          instrumentGrid?.forEach((row, noteIndex) => {
            if (row?.[currentStep]) {
              const note = pianoNotes[noteIndex];
              const player = playersRef.current[instrument];
              player?.triggerAttackRelease(note, "4n");
              if (isRecording) recordSequence(instrument, note, currentStep);
            }
          });
        });
      }

      currentStep++;
      updateStepRow(currentStep);

      if (currentStep >= stepValue) {
        currentStep = 0;
        updateStepRow(0);

        let nextRow = row + 1;
        let nextCol = col;

        if (nextRow >= playlistGrid.length) {
          nextRow = 0;
          nextCol = col + 1;
          if (nextCol >= playlistGrid[0].length) {
            if (loopMode === "none") {
              StopSong();
              return;
            }
            nextCol = loopMode === "all" ? 0 : col;
          }
        }

        setCurrentPlaylistRow(nextRow);
        setCurrentPlaylistCol(nextCol);
      }
    }, intervalTime);

    setPlaylistInterval(interval);
    setIsPlaying(true);
    Tone.Transport.start();
  }, [bpm, stepValue, isRecording, playlistInterval, loopMode, recordSequence, updateStepRow, pianoNotes, StopSong]);

  // ... retourne la partie JSX de ton UI (non incluse ici pour clarté)
    const handlePlayClick = useCallback(() => {
    if (songMode) {
      PlaySong();
    } else {
      setIsPlaying(true);
      Tone.Transport.start();
    }
  }, [songMode, PlaySong]);

  const handleStopClick = useCallback(() => {
    setIsPlaying(false);
    updateStepRow(0);
    Tone.Transport.stop();
    StopSong();
  }, [updateStepRow, StopSong]);

  const handleRecordClick = useCallback(() => {
    setIsRecording(prev => !prev);
    setRecordedSequence([]);
  }, []);

  const handleReplayClick = useCallback(() => {
    if (isReplaying || recordedSequence.length === 0) return;

    setIsReplaying(true);
    setIsPlaying(false);
    Tone.Transport.stop();

    const sortedSequence = [...recordedSequence].sort((a, b) => a.time - b.time);
    const startTime = sortedSequence[0]?.time || 0;

    const timeouts = sortedSequence.map(note => {
      const delay = note.time - startTime;
      return setTimeout(() => {
        const player = players[note.instrument];
        if (player) player.triggerAttackRelease(note.note, "4n");
      }, delay);
    });

    setPlaybackTimeouts(timeouts);

    setTimeout(() => {
      setIsReplaying(false);
    }, sortedSequence[sortedSequence.length - 1]?.time - startTime);
  }, [isReplaying, recordedSequence, players]);

  const handleClearClick = useCallback(() => {
    setIsClearing(true);
    setRecordedSequence([]);
    setTimeout(() => setIsClearing(false), 500);
  }, []);

  const handleSongModeToggle = useCallback(() => {
    setSongMode(prev => !prev);
  }, []);

  const handleLoopModeToggle = useCallback(() => {
    setLoopMode(prev => (prev === "none" ? "all" : "none"));
  }, []);

  return (
  <div className=" text-white rounded-lg z-[2500] flex flex-col absolute top-0 left-0">
    
    {/* Groupe de boutons principaux */}
    <div className="absolute top-0.5 left-100 gap-1.5 flex flex-row">
      <button
        onClick={handlePlayClick}
        onMouseEnter={songMode ? () => infos('Play Song') : () => infos('Play Pattern')}
        onMouseLeave={onMouseLeave}
        className={`px-3 py-2 rounded ${isPlaying ? 'bg-green-500 text-gray-700' : 'bg-gray-500 text-black'}`}
      >
        {isPlaying ? <FaRegPlayCircle size={20} color="green" /> : <FaPauseCircle color="red" size={20} />}
      </button>

      <button
        onClick={handleStopClick}
        onMouseEnter={songMode ? () => infos('Stop Song') : () => infos('Stop Pattern')}
        onMouseLeave={onMouseLeave}
        className="px-3 py-2 rounded bg-gray-500 text-red-500"
      >
        <FaRegStopCircle size={20} />
      </button>

      <button
        onClick={handleRecordClick}
        onMouseEnter={() => infos('Record')}
        onMouseLeave={onMouseLeave}
        className={`px-3 py-2 rounded ${isRecording ? 'bg-red-600 text-white' : 'bg-gray-500 text-black'}`}
      >
        {isRecording ? <PiRecordBold size={20} /> : <BsFillRecordCircleFill size={20} />}
      </button>

      <button
        onClick={handleReplayClick}
        onMouseEnter={() => infos('Replay')}
        onMouseLeave={onMouseLeave}
        disabled={recordedSequence.length === 0}
        className="px-3 py-2 rounded bg-gray-500 text-red-500 disabled:opacity-50"
      >
        <MdReplay size={20} />
      </button>

      <button
        onClick={handleClearClick}
        onMouseEnter={() => infos('Clear')}
        onMouseLeave={onMouseLeave}
        className="px-3 py-2 rounded bg-gray-500 text-red-500"
      >
        <BsFillTrashFill size={20} />
      </button>
    </div>

    {/* Mode & BPM */}
    <div className="absolute top-0 right-[15px] flex items-center gap-4">
      <button
        onClick={handleSongModeToggle}
        onMouseEnter={songMode ? () => infos('SongMode') : () => infos('PatternMode')}
        onMouseLeave={onMouseLeave}
        className={`px-3 py-2 rounded ${songMode ? 'bg-blue-600 text-white' : 'bg-gray-500 text-black'}`}
      >
        {songMode ? <PiPlaylistFill size={20} /> : <PiPianoKeysFill size={20} />}
      </button>

      <button
        onClick={handleLoopModeToggle}
        onMouseEnter={() => infos('LoopMode')}
        onMouseLeave={onMouseLeave}
        className={`px-3 py-2 rounded border ${
          loopMode === 'all' ? 'border-green-500 text-green-500' : 'border-gray-400 text-white'
        }`}
      >
        {loopMode === 'none' ? 'No Loop' : 'Loop All'}
      </button>

      <div className="ml-4">
        <label htmlFor="bpm" className="block text-sm font-medium text-white mb-1">BPM</label>
        <input
          id="bpm"
          type="number"
          value={bpm}
          min={30}
          max={300}
          onChange={(e) => setBPM(parseInt(e.target.value) || 0)}
          onMouseEnter={() => infos('BPM')}
          onMouseLeave={onMouseLeave}
          className="w-24 px-2 py-1 rounded bg-gray-500 text-black"
        />
      </div>
    </div>
  </div>
);

};

export default Transport;
