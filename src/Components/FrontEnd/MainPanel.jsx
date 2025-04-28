import React, { useContext } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ColorContext } from "../Contexts/ColorProvider";

export default function MainPanel({ infoToDisplay }) {
  const { colors } = useContext(ColorContext);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 5,
        right: 10,
        zIndex: 800
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: 200, // largeur fixe
          height: 40, // hauteur fixe
          bgcolor: colors.panelColor,
          border: "1px solid #ccc",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
          overflow: "hidden",
          textAlign: "center"
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "black",
            fontSize: "14px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%"
          }}
        >
          {infoToDisplay}
        </Typography>

        
      </Paper>

      
    </Box>
  );
}
