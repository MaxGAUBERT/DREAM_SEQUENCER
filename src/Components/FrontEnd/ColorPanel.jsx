import React from "react";
import { Box, TextField, Typography } from "@mui/material";
import { useColors } from "../Contexts/ColorProvider"; // adapte le chemin

const ColorPanel = () => {
  const { colors, updateColor } = useColors();

  return (
    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
      <Typography variant="h6" gutterBottom>
        Modifier les couleurs
      </Typography>

      {Object.entries(colors).map(([name, value]) => (
        <TextField
          key={name}
          label={name}
          type="color"
          value={value}
          onChange={(e) => updateColor(name, e.target.value)}
          sx={{ marginBottom: 2 }}
        />
      ))}
    </Box>
  );
};

export default ColorPanel;
