import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Button, Typography, TextField } from "@mui/material";
import * as Tone from "tone";
import { FaRegPlayCircle, FaRegStopCircle } from "react-icons/fa";


const Transport = ({
  stepValue,
  players,
  grids,
  setStepRow,
  onMouseEnter,
  onMouseLeave,
  setIsPlaying: setParentIsPlaying,
}) => {
  // États essentiels
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBPM] = useState(120);
  const [stepRow, setLocalStepRow] = useState(0);

  // Génère la liste de notes en correspondance avec le PianoRoll (C3 → B5)
  const generateNoteList = useCallback((num) => {
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
    return result.reverse(); // Inversion pour avoir les notes aiguës en haut comme dans PianoRoll
  }, []);

  const [time, setTime] = useState(0);
  
  // Liste complète des notes du piano (C3 → B5)
  const pianoNotes = useMemo(() => generateNoteList(36), [generateNoteList]);
  
  // Références pour éviter les problèmes de fermeture
  const gridsRef = useRef(grids);
  const playersRef = useRef(players);
  const stepRowRef = useRef(stepRow);
  const repeatIdRef = useRef(null);

  // Maintenir les refs à jour
  useEffect(() => { gridsRef.current = grids; }, [grids]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { stepRowRef.current = stepRow; }, [stepRow]);
  useEffect(() => { setParentIsPlaying?.(isPlaying); }, [isPlaying, setParentIsPlaying]);
  useEffect(() => { Tone.Transport.bpm.value = bpm; }, [bpm]);

   // Minutes calculation
  const minutes = Math.floor((time % 360000) / 6000);
  // Seconds calculation
  const seconds = Math.floor((time % 6000) / 100);
  // Milliseconds calculation
  const milliseconds = time % 100;

  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setTime(Math.floor(Tone.Transport.seconds * 100)); // ou .toFixed(2)
      }, 50); // toutes les 50ms
    }
    return () => clearInterval(intervalId);
  }, [isPlaying]);


  // Fonction d'update du step courant
  const updateStepRow = useCallback((newValueOrUpdater) => {
    const newValue = typeof newValueOrUpdater === "function"
      ? newValueOrUpdater(stepRowRef.current)
      : newValueOrUpdater;

    setLocalStepRow(newValue);
    setStepRow?.(newValue);
  }, [setStepRow]);

  // Fonction de gestion des hovers pour l'aide contextuelle
  const handleElementHover = useCallback(() => {
    onMouseEnter?.("Transport");
  }, [onMouseEnter]);

  const handleSpecificHover = useCallback((label) => {
    onMouseEnter?.(label);
  }, [onMouseEnter]);

  useEffect(() => {
  if (!isPlaying || !players || Object.keys(players).length === 0) return;

  // Supprimer les éventuels événements précédents
  if (repeatIdRef.current) {
    Tone.Transport.clear(repeatIdRef.current);
  }

  // Schedule une répétition tous les 16e de note ("16n")
  repeatIdRef.current = Tone.Transport.scheduleRepeat((time) => {
    // Calcul du step suivant
    updateStepRow(prevStep => {
      const nextStep = (prevStep + 1) % stepValue;
      const currentGrids = gridsRef.current;

      // Lecture des notes de chaque instrument
      Object.entries(currentGrids).forEach(([instrument, instrumentGrid]) => {
        instrumentGrid?.forEach((row, rowIndex) => {
          if (row?.[nextStep]) {
            const note = pianoNotes[rowIndex];
            const player = playersRef.current[instrument];
            console.log(`Playing ${note} on ${instrument} at step ${nextStep}`);
            player?.triggerAttackRelease(note, "8n", time); // synchronisé !
          }
        });
      });

      // Remet le timer à 0 quand on boucle
      if (nextStep === 0) setTime(0);

      return nextStep;
    });
  }, "8n"); // une step toutes les 16e notes (4 per beat)

  // Démarre le transport si ce n'est pas déjà fait
  if (!Tone.Transport.state || Tone.Transport.state !== 'started') {
    Tone.Transport.start();
  }

  return () => {
    if (repeatIdRef.current) {
      Tone.Transport.clear(repeatIdRef.current);
      repeatIdRef.current = null;
    }
  };
}, [isPlaying, bpm, stepValue, updateStepRow, pianoNotes]);

  // Gestion du bouton Play
  const handlePlayClick = useCallback(() => {
    setIsPlaying(true);
    Tone.Transport.start();
  }, []);

  // Gestion du bouton Stop
  const handleStopClick = useCallback(() => {
    setIsPlaying(false);
    updateStepRow(0);
    setTime(0);
    Tone.Transport.stop();
    if (repeatIdRef.current) {
      Tone.Transport.clear(repeatIdRef.current);
      repeatIdRef.current = null;
}

  }, [updateStepRow]);

  return (
    <Box
      onMouseEnter={handleElementHover}
      onMouseLeave={onMouseLeave}
      width={"100%"}
      sx={{
        p: 2,
        bgcolor: '#222',
        width: {
          xl: '100%',
          sm: 'auto'
        },
        height: '10px',
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: '0px',
        left: "38%",
        transform: 'translateX(-50%)',
        zIndex: 1
      }}
    >
      <Button
        onClick={handlePlayClick}
        variant="contained"
        sx={{ 
          bgcolor: 'green',
          color: 'white',
          '&:hover': {
            bgcolor: "gray",
          }
        }}
        onMouseEnter={() => handleSpecificHover('Play')}
      >
        <FaRegPlayCircle size={20} />
      </Button>

      <Button 
        onClick={handleStopClick}
        variant="contained"
        sx={{ 
          bgcolor: '#f44336', 
          color: 'white',
          '&:hover': {
            bgcolor: '#d32f2f',
          }
        }}
        onMouseEnter={() => handleSpecificHover('Stop')}
      >
        <FaRegStopCircle size={20} />
      </Button>

      <TextField
        label="BPM"
        type="number"
        value={bpm}
        onChange={(e) => setBPM(parseInt(e.target.value) || 120)}
        inputProps={{ min: 30, max: 300 }}
        onMouseEnter={() => handleSpecificHover('BPM')}
        size="small"
        sx={{
          width: '100px',
          '& .MuiInputBase-input': {
            color: 'white',
          },
          '& .MuiInputLabel-root': {
            color: 'white',
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'white',
            },
            '&:hover fieldset': {
              borderColor: 'white',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4caf50',
            },
          },
        }}
      />

      <Typography variant="body2" onMouseEnter={() => handleSpecificHover('Timer')} sx={{ borderStyle: 'solid', borderWidth: '4px', borderColor: 'white', color: 'red', fontFamily: 'silkscreen', fontSize: '15px' }}>
        {minutes}:{minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}:
        {milliseconds.toString().padStart(2, "0")}
      </Typography>
      
    </Box>
  );
};

export default Transport;