import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Divider, Input } from '@mui/material';
import * as Tone from 'tone';

const SoundBrowser = (props) => {
  const [samples, setSamples] = useState([]);

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files).filter(file =>
      file.type.startsWith('audio/')
    );

    const sampleList = files.map(file => ({
      name: file.name,
      file,
      url: URL.createObjectURL(file),
    }));

    setSamples(sampleList);
  };

  const handlePreview = async (url) => {
    try {
      await Tone.start(); // Nécessaire pour autoriser le son
      const player = new Tone.Player(url).toDestination();
      
      player.onstop = () => {
        player.dispose();
      };
      
      player.autostart = true;

      // Détruire après lecture
      setTimeout(() => {
        if (player && !player.disposed) {
          player.dispose();
        }
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la lecture du son:", error);
    }
  };

  const handleDragStart = (e, sample) => {
    // Important: utiliser text/plain comme format principal pour assurer la compatibilité
    e.dataTransfer.setData("text/plain", sample.url);
    
    // Pour le débogage
    console.log("Drag started with sample URL:", sample.url);
  };

  return (
    <Box
      width={300}
      p={2}
      sx={{
        bgcolor: '#1e1e1e',
        color: 'white',
        position: 'fixed',
        top: 45,
        left: 0,
        height: "100%",
        width: 250,
        overflowY: 'auto',
      }}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Silkscreen, cursive' }} gutterBottom>
        Sound Browser
      </Typography>

      <Button
        variant="contained"
        fullWidth
        sx={{ mb: 2 }}
        onClick={() => document.getElementById("folderInput").click()}
      >
        Import
      </Button>
      <Input
        id="folderInput"
        type="file"
        inputProps={{ webkitdirectory: "true", directory: "true", multiple: true }}
        sx={{ display: 'none' }}
        onChange={handleFolderSelect}
      />

      <Divider sx={{ borderColor: '#555', mb: 2 }} />

      <List>
        {samples.map((sample, index) => (
          <Box
            key={index}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, sample)}
            sx={{ 
              cursor: 'grab',
              '&:hover': {
                backgroundColor: '#333333',
                borderRadius: 1
              }
            }}
          >
            <ListItem
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: '#2a2a2a',
                mb: 1,
                borderRadius: 2,
                px: 1,
              }}
            >
              <ListItemText 
                primary={sample.name} 
                sx={{ 
                  color: 'white',
                  '.MuiListItemText-primary': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }} 
              />
              <Button
                size="small"
                onClick={() => handlePreview(sample.url)}
                variant="outlined"
              >
                Preview
              </Button>
            </ListItem>
          </Box>
        ))}
      </List>
      
      {samples.length === 0 && (
        <Typography variant="body2" sx={{ color: '#aaa', textAlign: 'center', mt: 4 }}>
          No samples loaded
        </Typography>
      )}
    </Box>
  );
};

export default SoundBrowser;