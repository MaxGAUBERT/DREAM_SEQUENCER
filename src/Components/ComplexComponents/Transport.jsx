import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Button, Typography, TextField, Radio } from "@mui/material";
import * as Tone from "tone";
import { FaRegPlayCircle, FaRegStopCircle } from "react-icons/fa";
import { BsFillSignStopFill, BsFillTrashFill, BsFillRecordCircleFill } from "react-icons/bs";
import { MdReplay, MdRepeat, MdRepeatOne, MdOutlineFastForward, MdOutlineFastRewind } from "react-icons/md";
import { Label } from "@headlessui/react";


const Transport = ({
  stepValue,
  players,
  grids,
  playlist,
  patterns,
  setStepRow,
  onMouseEnter,
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

  const handleElementHover = useCallback(() => {
    onMouseEnter?.("Transport");
  }, [onMouseEnter]);

  const handleSpecificHover = useCallback((label) => {
    onMouseEnter?.(label);
  }, [onMouseEnter]);

  // Pattern playback
  useEffect(() => {
    if (!isPlaying || songMode || !players || Object.keys(players).length === 0) return;

    const intervalTime = (60 / bpm / 4) * 1000;

    const interval = setInterval(() => {
      updateStepRow(prevStep => {
        const nextStep = (prevStep + 1) % stepValue;
        const currentGrids = gridsRef.current;

        Object.entries(currentGrids).forEach(([instrument, instrumentGrid]) => {
          instrumentGrid?.forEach((row, noteIndex) => {
            if (row?.[nextStep]) {
              const note = pianoNotes[noteIndex];
              const player = playersRef.current[instrument];
              player?.triggerAttackRelease(note, "4n");
              if (isRecording) recordSequence(instrument, note, nextStep);
            }
          });
        });

        return nextStep;
      });
    }, intervalTime);

    return () => clearInterval(interval);
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
    onMouseEnter={handleElementHover}
    onMouseLeave={onMouseLeave}
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
    <Box sx={{ display: 'flex', position: 'absolute', top: 0, left: 420, alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Button
        onClick={handlePlayClick}
        variant="contained"
        color={isPlaying ? 'success' : 'primary'}
        onMouseEnter={() => handleSpecificHover('Play')}
      >
        {isPlaying ? 'Playing' : 'Play'}
      </Button>
      <Button
        onClick={handleStopClick}
        variant="outlined"
        color="secondary"
        onMouseEnter={() => handleSpecificHover('Stop')}
      >
        Stop
      </Button>
      <Button
        onClick={handleRecordClick}
        variant={isRecording ? 'contained' : 'outlined'}
        color="error"
        onMouseEnter={() => handleSpecificHover('Record')}
      >
        {isRecording ? 'Recording...' : 'Record'}
      </Button>
      <Button
        onClick={handleReplayClick}
        variant="outlined"
        sx={{color: 'red'}}
        onMouseEnter={() => handleSpecificHover('Replay')}
        disabled={recordedSequence.length === 0}
      >
        Replay
      </Button>
      <Button
        onClick={handleClearClick}
        variant="outlined"
        color="warning"
        onMouseEnter={() => handleSpecificHover('Clear')}
      >
        Clear
      </Button>
    </Box>

    <Box sx={{ display: 'flex', position: 'absolute', top: 0, left: 900, alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Button
        onClick={handleSongModeToggle}
        variant={songMode ? 'contained' : 'outlined'}
        color="secondary"
        onMouseEnter={() => handleSpecificHover('Song Mode')}
      >
        {songMode ? 'Song Mode' : 'Pattern Mode'}
      </Button>
      <Button
        onClick={handleLoopModeToggle}
        variant="outlined"
        color={loopMode === 'all' ? 'success' : 'inherit'}
        onMouseEnter={() => handleSpecificHover('Loop Mode')}
      >
        {loopMode === 'none' ? 'No Loop' : 'Loop All'}
      </Button>
      <TextField
        label="BPM"
        type="number"
        value={bpm}
        onChange={(e) => setBPM(parseInt(e.target.value) || 0)}
        inputProps={{ min: 30, max: 300 }}
        onMouseEnter={() => handleSpecificHover('BPM')}
        size="small"
      />
    </Box>
  </Box>
);
};

export default Transport;

