// PianoRollRow.jsx
import React from "react";
import { Box } from "@mui/material";

const isBlackKey = (note) => note.includes("#");

const PianoRollRow = React.memo(
  ({ note, rowIdx, rowData, playNote, handleMouseDown, handleMouseEnter, handleMouseUp, handleMouseLeave }) => {
    return (
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        {/* Touche piano */}
        <Box
          onClick={() => playNote(note)}
          sx={{
            width: 90,
            minWidth: 60,
            height: 22,
            backgroundColor: isBlackKey(note) ? "#333" : "#fff",
            color: isBlackKey(note) ? "#eee" : "#000",
            borderRight: "1px solid #666",
            borderBottom: "1px solid #444",
            display: "flex",
            alignItems: "center",
            paddingLeft: 1,
            cursor: "pointer",
            fontSize: "0.8rem",
            fontFamily: "monospace",
            position: "sticky",
            left: 0,
            zIndex: 2,
            boxShadow: "2px 0px 5px rgba(0,0,0,0.3)",
          }}
        >
          {note}
        </Box>

        {/* Grille de notes */}
        {rowData.map((step, colIdx) => (
          <Box
            key={colIdx}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown(rowIdx, colIdx);
            }}
            onMouseEnter={() => {
             
              handleMouseEnter(rowIdx, colIdx);
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            sx={{
              width: 30,
              height: 22,
              bgcolor: step
                ? "#4caf50"
                : isBlackKey(note)
                ? "#1a1a1a"
                : "#222",
              borderBottom: `1px solid ${isBlackKey(note) ? "#2a2a2a" : "#333"}`,
              borderRight: "1px dotted #444",
              "&:hover": {
                bgcolor: step ? "#f44336" : "#555",
                cursor: "pointer",
              },
              ...(colIdx % 4 === 0 && {
                borderLeft: "1px solid #666",
              }),
              userSelect: "none",
            }}
          />
        ))}
      </Box>
    );
  }
);

export default PianoRollRow;
