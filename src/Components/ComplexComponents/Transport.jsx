import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Button, Typography, TextField } from "@mui/material";
import * as Tone from "tone";
import { FaRegPlayCircle, FaRegStopCircle } from "react-icons/fa";

const Transport = () => ({ stepValue, players, grids, setStepRow, onMouseEnter, onMouseLeave, setIsPlaying: setParentIsPlaying, setStepValue: setParentStepValue}) => {
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBPM] = useState(120);
    const [stepRow, setLocalStepRow] = useState(0);

  


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
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}:
        {milliseconds.toString().padStart(2, "0")}
      </Typography>
      
    </Box>
  );
};

export default Transport;