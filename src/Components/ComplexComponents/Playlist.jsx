import React, { useEffect, useState } from "react";
import { Box, Button, Container, Typography, Paper, Divider, Select, MenuItem, Input } from "@mui/material";
import { CiCircleRemove } from "react-icons/ci";
import { IoMdArrowDropright } from "react-icons/io";
import { MdDelete } from "react-icons/md";

export default function Playlist({ 
  playlist, 
  setPlaylist, 
  rows, 
  cols, 
  setRows, 
  setCols, 
  onPlacePattern,
  patterns,
  onMouseEnter,
  onMouseLeave,
  currentPlaylistRow,
  currentPlaylistCol,
  isSongPlaying        // Prop pour savoir si on lit actuellement la playlist
}) {
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
  const [activePattern, setActivePattern] = useState(null);
  const [eraserMode, setEraserMode] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  const cellSize = 70;

  // Couleur par pattern ID
  const getPatternColor = (pattern) => {
    if (!pattern?.id) return "#2c2c2c";
    const colors = ["#ff5252", "#4caf50", "#2196f3", "#ff9800", "#e91e63"];
    return colors[(pattern.id - 1) % colors.length];
  };

  // Mise à jour de la grille quand les dimensions changent
  useEffect(() => {
    if (rows < 5 || cols < 5) {
      setRows(5);
      setCols(5);
    };
    setPlaylist((prev) => {
      const oldGrid = prev.initGrid || [];
      const newGrid = Array.from({ length: rows }, (_, rowIdx) =>
        Array.from({ length: cols }, (_, colIdx) =>
          rowIdx < oldGrid.length && colIdx < (oldGrid[rowIdx]?.length || 0)
            ? oldGrid[rowIdx][colIdx]
            : null
        )
      );
      return { ...prev, initGrid: newGrid };
    });
  }, [rows, cols, setPlaylist]);

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
  
    if (eraserMode) {
      onPlacePattern(row, col, null);
    } else if (activePattern) {
      onPlacePattern(row, col, activePattern);
    }
  };

  const handlePatternSelect = (pattern) => {
    setActivePattern(prev => prev?.id === pattern.id ? null : pattern);
  };

  return (
    <Container sx={{ overflow: "hidden", width: 1000, position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
       <Paper sx={{ backgroundColor: "#2c2c2c", width: "100%", position: "relative", top: 65, alignContent: "center", borderStyle: "inset", borderColor: "white", borderWidth: 5}}>
        <Box 
          sx={{ 
            display: "flex", 
            flexDirection: "row", 
            alignItems: "center",
            justifyContent: "start",
            mt: 1
          }}
        >
          <Typography sx={{ color: "white" }}>Rows</Typography>
          <Input
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            sx={{ width: "60px", color: "white", ml: 2 }}
          />

          <Typography sx={{ color: "white"}}>Cols</Typography>
          <Input
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            sx={{ width: "60px", color: "white", ml: 2 }}
          />

          <Button
            onClick={() => {
              setActivePattern(null); // désélectionner les patterns
              setEraserMode((prev) => !prev);
            }}
            variant={eraserMode ? "contained" : "outlined"}
            sx={{
              mr: 2,
              color: "white",
              backgroundColor: eraserMode ? "red" : "gray",
              '&:hover': { backgroundColor: "darkred" },
            }}
          >
            <CiCircleRemove size={20} backgroundColor="white"/>
          </Button>

          <Button
            onClick={() => setPlaylist({ initGrid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)) })}
            variant="outlined"
            sx={{ mr: 2, color: "white", backgroundColor: "gray", '&:hover': { backgroundColor: "black" } }}
          >
            <MdDelete size={20} />
          </Button>

          <Select
            value={activePattern?.id || ""}
            onChange={(e) => handlePatternSelect(patterns.find((p) => p.id === Number(e.target.value)))}
            sx={{ width: 100, color: "white", pr: 2, backgroundColor: "gray", "&:hover": { backgroundColor: "black" } }}
            displayEmpty
            disabled={eraserMode}
          >
            {patterns.map((pattern) => (
              <MenuItem key={pattern.id} value={pattern.id}>
                {pattern.name}
              </MenuItem>
            ))}
          </Select>

          <Typography variant="body2" sx={{ color: "#ccc" }}>
            {activePattern 
              ? `Selected: ${activePattern.name} - Click on grid to place it` 
              : "Select a pattern to place on the grid"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "fixed", left: "20%", top: 100}}>
        </Box>  
      </Paper>
      
      {/* Timeline pour la lecture de playlist */}
      {showTimeline && (
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          height: 30, 
          bgcolor: "#333", 
          px: 2, 
          border: "1px solid #555",
          position: "relative",
          top: 50,
          left: 0,
        }}>
          <Typography sx={{ color: "white", mr: 1 }}>Timeline:</Typography>
          
          <Box sx={{ 
            display: "flex", 
            flexGrow: 1, 
            height: 30, 
            bgcolor: "#222", 
            borderRadius: 1, 
            position: "relative",
            overflow: "hidden"
          }}>
            {Array(cols).fill().map((_, i) => (
              <Box 
                key={`timeline-${i}`} 
                sx={{ 
                  height: "100%", 
                  width: `${100/cols}%`, 
                  borderRight: i < cols-1 ? "1px solid #555" : "none",
                  bgcolor: i === currentPlaylistCol && isSongPlaying ? "rgba(255, 0, 0, 0.3)" : "transparent",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#999",
                  fontSize: "0.7rem"
                }}
              >
                {i+1}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Paper elevation={3} sx={{ p: 8, overflow: "auto", maxHeight: "60vh", bgcolor: "#222" }}>
        <Box sx={{ minWidth: (cols + 1) * cellSize }}>
          {/* En-têtes de colonnes avec première colonne vide */}
          <Box sx={{ display: "flex", top: 0, backgroundColor: "#222", zIndex: 1 }}>
            <Box sx={{ width: cellSize, height: cellSize, borderRight: '1px solid #666' }} />
            {Array(cols).fill().map((_, colIndex) => (
              <Box
                key={`col-${colIndex}`}
                sx={{
                  width: cellSize,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: '1px solid #666',
                  color: 'white',
                  fontSize: '0.75rem',
                  backgroundColor: colIndex === currentPlaylistCol && isSongPlaying ? "rgba(255, 0, 0, 0.2)" : "transparent",
                }}
              >
                {colIndex + 1}
              </Box>
            ))}
          </Box>

          {/* Grille modifiée pour indiquer la colonne active */}
          {playlist.initGrid?.map((row, rowIndex) => (
            <Box 
              key={`row-${rowIndex}`} 
              sx={{ 
                display: "flex",
                position: "relative", 
                backgroundColor: rowIndex === currentPlaylistRow && 
                                 currentPlaylistCol !== null && 
                                 isSongPlaying ? "rgba(255, 165, 0, 0.2)" : "transparent"
              }}
            >

            {rowIndex === currentPlaylistRow && isSongPlaying && (
                <Box
                  sx={{
                    position: "absolute",
                    left: "-15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "orange",
                    zIndex: 5
                  }}
                >
                  <IoMdArrowDropright size={24} />
                </Box>
              )}
              {/* Index de ligne */}
              <Box
                sx={{
                  width: cellSize,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: '1px solid #666',
                  borderBottom: '1px solid #666',
                  color: 'white',
                  fontSize: '0.8rem',
                  backgroundColor: rowIndex === currentPlaylistRow && isSongPlaying ? "rgba(255, 165, 0, 0.4)" : "#333"
                }}
              >
                {rowIndex + 1}
              </Box>

              {row.map((cell, colIndex) => {
                const isSelected = selectedCell.row === rowIndex && selectedCell.col === colIndex;
                const isCurrentStep = colIndex === currentPlaylistCol && 
                                    rowIndex === currentPlaylistRow && 
                                    isSongPlaying;
                
                return (
                  <Box
                    key={`cell-${rowIndex}-${colIndex}`}
                    sx={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isSelected
                        ? cell 
                          ? `${getPatternColor(cell)}aa`
                          : "#333" // A darker color when selected with no pattern
                        : cell
                        ? getPatternColor(cell)
                        : "#2c2c2c",
                      border: isCurrentStep 
                        ? "2px solid #ff7700" 
                        : isSelected 
                          ? "2px solid #bb00d4" 
                          : colIndex === currentPlaylistCol && isSongPlaying
                            ? "1px solid #ff7700"
                            : "1px solid #666",
                      boxSizing: "border-box",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: '0.7rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      position: "relative",
                      '&:hover': {
                        opacity: 0.8,
                        boxShadow: '0 0 5px rgba(255,255,255,0.3)'
                      }
                    }}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell?.id ? `P${cell.id}` : ""}
                    
                    {/* Indicateur visuel de lecture */}
                    {isCurrentStep && (
                      <Box 
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(255, 255, 0, 0.2)",
                          animation: "pulse 1s infinite"
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Paper>
      
      {/* Style pour l'animation de pulse */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </Container>
  );
}