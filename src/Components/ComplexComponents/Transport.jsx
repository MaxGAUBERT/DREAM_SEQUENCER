import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Box, Button, Typography, TextField, Radio } from "@mui/material";
import { FaRegPlayCircle, FaRegStopCircle } from "react-icons/fa";
import { BsFillSignStopFill, BsFillTrashFill, BsFillRecordCircleFill } from "react-icons/bs";
import { MdReplay, MdRepeat, MdRepeatOne, MdOutlineFastForward, MdOutlineFastRewind } from "react-icons/md";

const Transport = ({ stepValue, 
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
  setCurrentPlaylistCol: setParentCurrentPlaylistCol
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBPM] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSequence, setRecordedSequence] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [playbackTimeouts, setPlaybackTimeouts] = useState([]);
  const [stepRow, setLocalStepRow] = useState(0); // Add local stepRow state

  const stepRowRef = useRef(0);
  const playersRef = useRef(players);
  const gridsRef = useRef(grids);
  const loopIdRef = useRef(null);
  const playlistRef = useRef(playlist);
  const patternsRef = useRef(patterns);

   // Transport specific for playlist playback
  const [songMode, setSongMode] = useState(false);
  const [currentPlaylistRow, setCurrentPlaylistRow] = useState(0);
  const [currentPlaylistCol, setCurrentPlaylistCol] = useState(0);
  const [loopMode, setLoopMode] = useState("none"); // none, all, pattern
  const [playlistInterval, setPlaylistInterval] = useState(null);

  const currentPlaylistRowRef = useRef(currentPlaylistRow);
  const currentPlaylistColRef = useRef(currentPlaylistCol);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { gridsRef.current = grids; }, [grids]);
  useEffect(() => { Tone.Transport.bpm.value = bpm; }, [bpm]);

  const pianoNotes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

  const updateStepRow = (val) => {
    stepRowRef.current = val;
    setStepRow(val);
  };

  useEffect(() => {
    if (!isPlaying || !Object.keys(playersRef.current).length) return;

    const loop = (time) => {
      const nextStep = (stepRowRef.current + 1) % stepValue;
      updateStepRow(nextStep);
      const currentGrids = gridsRef.current;

      for (const [instrument, grid] of Object.entries(currentGrids)) {
        const instrumentGrid = grid;
        if (!instrumentGrid) continue;
        for (let i = 0; i < instrumentGrid.length; i++) {
          const row = instrumentGrid[i];
          if (row && row[nextStep]) {
            const note = pianoNotes[i];
            const player = playersRef.current[instrument];
            if (player) player.triggerAttackRelease(note, "4n", time);
          }
        }
      }
    };

    loopIdRef.current = Tone.Transport.scheduleRepeat(loop, "16n");
    Tone.Transport.start();

    return () => {
      Tone.Transport.clear(loopIdRef.current);
      Tone.Transport.stop();
    };
  }, [isPlaying, stepValue]);

  // Cette fonction gère la lecture de la playlist
  const PlaySong = () => {
    if (!playersRef.current || Object.keys(playersRef.current).length === 0 || !playlistRef.current) return;
  
    // Arrêter l'intervalle précédent s'il existe
    if (playlistInterval) {
      clearInterval(playlistInterval);
    }
  
    // Réinitialiser les positions
    setCurrentPlaylistRow(0);
    setCurrentPlaylistCol(0);
    updateStepRow(0);
  
    const secondsPerBeat = 60 / bpm;
    const secondsPerStep = secondsPerBeat / 4;
    const intervalTime = secondsPerStep * 1000;
  
    let currentStep = 0;
  
    const interval = setInterval(() => {
      // Utiliser les refs pour accéder aux valeurs les plus récentes
      const playlistGrid = playlistRef.current?.initGrid;
      if (!playlistGrid || playlistGrid.length === 0) return;
  
      const row = currentPlaylistRowRef.current;
      const col = currentPlaylistColRef.current;
      
      // Vérification de sécurité pour éviter les index hors limites
      if (row >= playlistGrid.length || col >= playlistGrid[0].length) {
        StopSong();
        return;
      }
      
      const patternRef = playlistGrid[row]?.[col];
  
      if (patternRef) {
        // Trouver le pattern correspondant par ID
        const pattern = patternsRef.current.find(p => p.id === patternRef.id);
        
        if (pattern && pattern.grids) {
          Object.entries(pattern.grids).forEach(([instrument, instrumentGrid]) => {
            if (!instrumentGrid || !Array.isArray(instrumentGrid)) return;
            
            instrumentGrid.forEach((row, noteIndex) => {
              if (row && row[currentStep]) {
                const note = pianoNotes[noteIndex];
                if (playersRef.current[instrument]) {
                  playersRef.current[instrument].triggerAttackRelease(note, "4n");
                  if (isRecording) {
                    recordSequence(instrument, note, currentStep);
                  }
                }
              }
            });
          });
        }
      }
  
      // Avancer d'un step
      currentStep++;
      updateStepRow(currentStep);
  
      // Si on a atteint la fin du pattern (16 steps)
      if (currentStep >= stepValue) {
        currentStep = 0;
        updateStepRow(0);
  
        // Passer à la colonne suivante (ou retourner à la première)
        // Modification: On parcourt colonne par colonne
        let nextCol = col;
        let nextRow = row + 1;
  
        // Si on atteint la fin d'une colonne
        if (nextRow >= playlistGrid.length) {
          nextRow = 0;
          nextCol = col + 1;
          
          // Si on atteint la fin de la playlist
          if (nextCol >= playlistGrid[0].length) {
            if (loopMode === "none") {
              StopSong();
              return;
            } else if (loopMode === "all") {
              nextCol = 0; // Boucler à la première colonne
            } else if (loopMode === "pattern") {
              nextCol = col; // Rester sur la colonne actuelle
              nextRow = 0;  // Revenir à la première ligne
            }
          }
        }
        
        setCurrentPlaylistRow(nextRow);
        setCurrentPlaylistCol(nextCol);
      }
    }, intervalTime);
  
    setPlaylistInterval(interval);
    setIsPlaying(true);
    Tone.Transport.start();
  };

  // Mettre à jour les refs quand les données changent
  useEffect(() => {
    gridsRef.current = grids;
  }, [grids]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);
  
  useEffect(() => {
    patternsRef.current = patterns;
  }, [patterns]);
  
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  
  useEffect(() => {
    currentPlaylistRowRef.current = currentPlaylistRow;
    // Sync with parent component
    if (setParentCurrentPlaylistRow) {
      setParentCurrentPlaylistRow(currentPlaylistRow);
    }
  }, [currentPlaylistRow, setParentCurrentPlaylistRow]);
  
  useEffect(() => {
    currentPlaylistColRef.current = currentPlaylistCol;
    // Sync with parent component
    if (setParentCurrentPlaylistCol) {
      setParentCurrentPlaylistCol(currentPlaylistCol);
    }
  }, [currentPlaylistCol, setParentCurrentPlaylistCol]);

  useEffect(() => {
    stepRowRef.current = stepRow;
  }, [stepRow]);

  // Sync isPlaying with parent component
  useEffect(() => {
    if (setParentIsPlaying) {
      setParentIsPlaying(isPlaying);
    }
  }, [isPlaying, setParentIsPlaying]);

  // Sync songMode with parent component
  useEffect(() => {
    if (setParentSongMode) {
      setParentSongMode(songMode);
    }
  }, [songMode, setParentSongMode]);

  // Mettre à jour le tempo
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const recordSequence = (instrument, note, step) => {
    if (!isRecording) return;
    setRecordedSequence(prevSeq => [
      ...prevSeq,
      { instrument, note, step, time: Date.now() }
    ]);
  };

  const PlayPattern = () => {
    if (!playersRef.current || Object.keys(playersRef.current).length === 0) return;
    Tone.Transport.start();
    setIsPlaying(true);
  };

   const StopPattern = () => {
    setIsPlaying(false);
    updateStepRow(0);
  };

  const StopSong = () => {
    // Arrêter l'intervalle de lecture
    if (playlistInterval) {
      clearInterval(playlistInterval);
      setPlaylistInterval(null);
    }
    
    // Arrêter le transport
    Tone.Transport.stop();
    
    // Arrêter les notes en cours
    Object.values(playersRef.current).forEach(player => {
      if (player && typeof player.triggerRelease === 'function') {
        player.triggerRelease();
      }
    });
    
    // Réinitialiser l'état
    setIsPlaying(false);
    updateStepRow(0);
    setCurrentPlaylistRow(0);
    setCurrentPlaylistCol(0);
  };

  const playRecordedSequence = () => {
    if (!recordedSequence.length) return;
  
    stopPlayback();
  
    const timeouts = [];
    const secondsPerBeat = 60 / bpm;
    const secondsPerStep = secondsPerBeat / 4;
  
    recordedSequence.forEach(({ instrument, note, step }) => {
      const delay = step * secondsPerStep * 1000; // en ms
  
      const timeout = setTimeout(() => {
        if (playersRef.current[instrument]) {
          playersRef.current[instrument].triggerAttackRelease(note, "8n");
        }
      }, delay);
  
      timeouts.push(timeout);
    });
  
    setPlaybackTimeouts(timeouts);
    setIsReplaying(true);
  };
  
  const clearRecordedSequence = () => {
    if (!recordedSequence.length) return;
    setRecordedSequence([]);
    setIsClearing(true);
    setTimeout(() => setIsClearing(false), 2000);
  };

  const stopPlayback = () => {
    playbackTimeouts.forEach(timeout => clearTimeout(timeout));
    setPlaybackTimeouts([]);
    setIsReplaying(false);
  };

   // Fonction pour passer rapidement à la ligne suivante ou précédente
  const nextPlaylistCol = () => {
    if (!playlistRef.current?.initGrid || playlistRef.current.initGrid[0].length === 0) return;
    setCurrentPlaylistCol((prev) => (prev + 1) % playlistRef.current.initGrid[0].length);
  };
  
  const prevPlaylistCol = () => {
    if (!playlistRef.current?.initGrid || playlistRef.current.initGrid[0].length === 0) return;
    setCurrentPlaylistCol((prev) => (prev === 0 ? playlistRef.current.initGrid[0].length - 1 : prev - 1));
  };

  // Changer le mode de boucle
  const toggleLoopMode = () => {
    const modes = ["none", "all", "pattern"];
    const currentIndex = modes.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLoopMode(modes[nextIndex]);
  };

  // Obtenir l'icône pour le mode de boucle actuel
  const getLoopIcon = () => {
    switch (loopMode) {
      case "all":
        return <MdRepeat size={20} />;
      case "pattern":
        return <MdRepeatOne size={20} />;
      default:
        return <MdRepeat size={20} style={{ opacity: 0.5 }} />;
    }
  };

  // Gérer les survols
  const handleElementHover = () => {
    onMouseEnter("Transport");
  };

  const handleSpecificHover = (label) => {
    onMouseEnter(label);
  };


  return (
    <Box
      onMouseEnter={() => onMouseEnter("Transport")}
      onMouseLeave={onMouseLeave}
      sx={{
        position: "fixed",
        top: 0,
        left: 375,
        display: "flex",
        alignItems: "center",
        p: 1,
        flexDirection: "row",
        width: "100%",
        backgroundColor: "gray",
        boxShadow: "0px 3px 12px rgba(255, 9, 9, 0.5)",
        height: "35px",
        zIndex: 1
      }}
    >
      {/* Section supérieure: Contrôles principaux */}
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", mb: 1, gap: 2 }}>
        {/* Mode de lecture */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Radio
            onMouseEnter={() => handleSpecificHover("Play song mode")}
            onMouseLeave={() => handleElementHover()}
            checked={songMode}
            onChange={(e) => setSongMode(e.target.checked)}
            color="success"
          />
          <Typography sx={{ color: "white", mr: 2 }}>Song</Typography>

          <Radio
            onMouseEnter={() => handleSpecificHover("Play pattern mode")}
            onMouseLeave={() => handleElementHover()}
            checked={!songMode}
            onChange={(e) => setSongMode(!e.target.checked)}
            color="warning"
          />
          <Typography sx={{ color: "white" }}>Pattern</Typography>
        </Box>

        {/* ▶️ Lecture / arrêt */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button 
            onClick={songMode ? PlaySong : PlayPattern} 
            sx={{ color: "green", backgroundColor: "black" }}
            onMouseEnter={() => handleSpecificHover(songMode ? "Play song" : "Play pattern")}
            onMouseLeave={() => handleElementHover()}
          >
            <FaRegPlayCircle size={24} />
          </Button>
          <Button 
            onClick={songMode ? StopSong : StopPattern} 
            sx={{ color: "red", backgroundColor: "black" }}
            onMouseEnter={() => handleSpecificHover(songMode ? "Stop song" : "Stop pattern")}
            onMouseLeave={() => handleElementHover()}
          >
            <FaRegStopCircle size={24} />
          </Button>
        </Box>

        {/* Contrôles de navigation playlist */}
        {songMode && (
        <Box sx={{ display: "flex", gap: 1, pl: 2 }}>
          <Button
            onClick={prevPlaylistCol}
            sx={{ color: "white", backgroundColor: "black" }}
            onMouseEnter={() => handleSpecificHover("Previous column")}
            onMouseLeave={() => handleElementHover()}
          >
            <MdOutlineFastRewind size={20} />
          </Button>
          
          <Typography sx={{ 
            color: "white", 
            backgroundColor: "#333", 
            px: 2, 
            borderRadius: 1, 
            display: "flex", 
            alignItems: "center" 
          }}>
            Column: {currentPlaylistCol + 1} / {playlistRef.current?.initGrid?.[0]?.length || 0}
          </Typography>
          
          <Button
            onClick={nextPlaylistCol}
            sx={{ color: "white", backgroundColor: "black" }}
            onMouseEnter={() => handleSpecificHover("Next column")}
            onMouseLeave={() => handleElementHover()}
          >
            <MdOutlineFastForward size={20} />
          </Button>
          
          <Button
            onClick={toggleLoopMode}
            sx={{ color: "white", backgroundColor: "black" }}
            onMouseEnter={() => handleSpecificHover(`Loop mode: ${loopMode}`)}
            onMouseLeave={() => handleElementHover()}
          >
            {getLoopIcon()}
          </Button>
        </Box>
      )}

        {/* 🎚️ BPM */}
        <Box 
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleSpecificHover("Adjust tempo (Beats Per Minute)")}
          onMouseLeave={() => handleElementHover()}
        >
          <Typography color="white">BPM:</Typography>
          <TextField
            type="number"
            value={bpm}
            onChange={(e) => setBPM(Number(e.target.value) || 120)}
            InputProps={{ min: 60, max: 200, step: 5 }}
            sx={{
              width: 80,
              input: { color: "white" },
              label: { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#444" },
                "&:hover fieldset": { borderColor: "#888" },
              },
            }}
            variant="outlined"
            size="small"
          />

        </Box>
      </Box>


      {/* 🔴 Enregistrement + lecture séquence */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          sx={{ backgroundColor: "black" }}
          onClick={() => {
            if (!isRecording) setRecordedSequence([]);
            setIsRecording(!isRecording);
            setIsClearing(false);
          }}
          onMouseEnter={() => handleSpecificHover(isRecording ? "Stop recording" : "Start recording")}
          onMouseLeave={() => handleElementHover("Transport")}
        >
          <BsFillRecordCircleFill
            size={20}
            style={{ color: isRecording ? "red" : "white" }}
          />
        </Button>

        <Button
          sx={{ backgroundColor: "black" }}
          onClick={playRecordedSequence}
          disabled={!recordedSequence.length || isReplaying}
          onMouseEnter={() => handleSpecificHover("Play recorded sequence")}
          onMouseLeave={() => handleElementHover("Transport")}
        >
          <MdReplay size={20} color="white" />
        </Button>

        <Button
            onClick={stopPlayback}
            disabled={!isReplaying}
            sx={{ backgroundColor: "black" }}
            onMouseEnter={() => handleSpecificHover("Stop playback")}
            onMouseLeave={() => handleElementHover()}
          >
            <BsFillSignStopFill size={20} color={!isReplaying ? "gray" : "white"} />
          </Button>

          <Button
            onClick={clearRecordedSequence}
            disabled={!recordedSequence.length}
            sx={{ backgroundColor: "black" }}
            onMouseEnter={() => handleSpecificHover("Clear recorded sequence")}
            onMouseLeave={() => handleElementHover()}
          >
            <BsFillTrashFill size={20} color={!recordedSequence.length ? "gray" : "white"} />
          </Button>
        </Box>

        {/* Statistiques d'enregistrement */}
        {recordedSequence.length > 0 && (
          <Box 
            sx={{ display: "flex", alignItems: "center" }}
            onMouseEnter={() => handleSpecificHover("Recording stats")}
            onMouseLeave={() => handleElementHover()}
          >
            <Typography color="white" variant="body2">
              {isClearing 
                ? "Sequence cleared!" 
                : `${recordedSequence.length} notes recorded`}
            </Typography>
          </Box>
        )}

        {/* Message d'état */}
        <Box sx={{ ml: "auto" }}>
          <Typography 
            color="white" 
            variant="body2"
            sx={{ fontStyle: "italic" }}
          >
            {isPlaying 
              ? songMode 
                ? `Playing song (${loopMode === "none" ? "no loop" : loopMode === "all" ? "loop all" : "loop pattern"})` 
                : "Playing pattern" 
              : isRecording 
                ? "Recording enabled" 
                : isReplaying 
                  ? "Replaying sequence" 
                  : "Ready"}
          </Typography>
        </Box>

        {songMode && isPlaying && (
          <Typography sx={{ color: "white", ml: 2, fontSize: "0.8rem" }}>
            Position: Col {currentPlaylistCol + 1}, Row {currentPlaylistRow + 1}, Step {stepRow + 1}
          </Typography>
        )}
      </Box>
  );
};

export default Transport;
