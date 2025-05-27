import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Button, Typography, TextField, Radio } from "@mui/material";
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
  <Box
    sx={{
      p: 2,
      bgcolor: 'grey.900',
      color: 'white',
      borderRadius: 2,
      boxShadow: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <Box key={items} sx={{ display: 'flex', flexDirection: "rows", position: 'absolute', top: 2, left: 400, alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Button
        onClick={handlePlayClick}
        sx={{bgcolor: isPlaying ? 'green' : 'gray', color: isPlaying ? 'gray' : 'black'}}
        onMouseEnter={songMode ? () => infos('Play Song'): () => infos('Play Pattern')}
        onMouseLeave={onMouseLeave}
      >
        {isPlaying ? <FaRegPlayCircle size={20}/> : <FaPauseCircle size={20}/>}
      </Button>
      <Button
        onClick={handleStopClick}
        sx={{bgcolor: "gray", color: 'black'}} 
        onMouseEnter={songMode ? () => infos('Stop Song'): () => infos('Stop Pattern')}
        onMouseLeave={onMouseLeave}
      >
      <FaRegStopCircle size={20}/>
      </Button>
      <Button
        onClick={handleRecordClick}
        sx={{bgcolor: isRecording ? 'red' : 'gray', color: isRecording ? 'white' : 'black'}}
        color="error"
        onMouseEnter={() => infos('Record')}
        onMouseLeave={onMouseLeave}
      >
        {isRecording ? <PiRecordBold size={20}/> : <BsFillRecordCircleFill size={20}/>}
      </Button>
      <Button
        onClick={handleReplayClick}
        sx={{color: 'red', bgcolor: 'gray'}}
        onMouseEnter={() => infos('Replay')}
        onMouseLeave={onMouseLeave}
        disabled={recordedSequence.length === 0}
      >
        <MdReplay size={20}/>
      </Button>
      <Button
        onClick={handleClearClick}
        sx={{color: 'red', bgcolor: 'gray'}}
        onMouseEnter={() => infos('Clear')}
        onMouseLeave={onMouseLeave}
      >
        <BsFillTrashFill size={20}/>
      </Button>
    </Box>

    <Box sx={{ position: 'absolute', top: 0, right: 870, alignItems: 'center', gap: 2 }}>

      <Button
        onClick={handleSongModeToggle}
        sx={{bgcolor: songMode ? 'blue' : 'gray', color: songMode ? 'white' : 'black'}}
        onMouseEnter={songMode ? () => infos('SongMode'): () => infos('PatternMode')}
        onMouseLeave={onMouseLeave}
      >
        {songMode ? <PiPlaylistFill size={20}/> : <PiPianoKeysFill size={20}/>}
      </Button>
      <Button
        onClick={handleLoopModeToggle}
        variant="outlined"
        color={loopMode === 'all' ? 'success' : 'inherit'}
        onMouseEnter={() => infos('LoopMode')}
        onMouseLeave={onMouseLeave}
      >
        {loopMode === 'none' ? 'No Loop' : 'Loop All'}
      </Button>
      <TextField
        label="BPM"
        type="number"
        value={bpm}
        sx={{ width: 100, bgcolor: 'gray', color: 'black', ml: 2 }}
        onChange={(e) => setBPM(parseInt(e.target.value) || 0)}
        inputProps={{ min: 30, max: 300 }}
        onMouseEnter={() => infos('BPM')}
        onMouseLeave={onMouseLeave}
        size="small"
      />
    </Box>
  </Box>
);
};

export default Transport;
