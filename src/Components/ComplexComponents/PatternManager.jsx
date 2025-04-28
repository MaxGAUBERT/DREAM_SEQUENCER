import React, {useEffect} from "react";
import { GrDuplicate } from "react-icons/gr";
import {
  Box,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { FaPlus, FaMinus } from "react-icons/fa6";

const PatternManager = ({
  patterns,
  selectedPattern,
  selectPattern,
  addPattern,
  duplicatePattern,
  deletePattern,
  onMouseEnter,
  onMouseLeave
}) => {

  return (
    <Box
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
      sx={{
        position: "absolute",
        top: "25px",
        left: "1400px",
        transform: "translate(-50%, -50%)",
        backgroundColor: "gray",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        p: 1,
        height: "35.5px",
        zIndex: 1,

        flexWrap: "wrap",
      }}
    >
    <FormControl sx={{ minWidth: 120 }} size="small">
  <InputLabel sx={{ color: "white" }}>Patterns</InputLabel>
  <Select
    value={selectedPattern?.id?.toString() || ""} // Assure que la value est une string
    label="Pattern"
    displayEmpty
    renderValue={(value) => {
      if (!value) return "Select a pattern";
      const selected = patterns.find((p) => p.id === parseInt(value));
      return selected ? selected.name : "Select a pattern";
    }}
    onChange={(e) => {
      const patternId = parseInt(e.target.value);
      const selected = patterns.find((p) => p.id === patternId);
      if (selected) {
        if (typeof selectPattern === "function") {
          selectPattern(selected); // on appelle maintenant `handleChangePattern`
        }
      }
    }}
    
    sx={{
      color: "white",
      ".MuiOutlinedInput-notchedOutline": {
        borderColor: "#555",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#888",
      },
      ".MuiSvgIcon-root": {
        fill: "white !important",
      },
    }}
  >
    {patterns.map((p) => (
        <MenuItem key={p.id} value={p.id.toString()}>
          {p.name}
        </MenuItem>
      ))}
  </Select>
  </FormControl>


      <Button
        onClick={addPattern}
        sx={{
          backgroundColor: "#333",
          color: "white",
          borderRadius: "50%",
          minWidth: "32px",
          height: "32px",
        }}
      >
        <FaPlus size={12} />
      </Button>

      <Button
        onClick={deletePattern}
        sx={{
          backgroundColor: "#333",
          color: "white",
          borderRadius: "50%",
          minWidth: "32px",
          height: "32px",
        }}
      >
        <FaMinus size={12} />
      </Button>

      <Button
        onClick={duplicatePattern}
        sx={{
          backgroundColor: "#333",
          color: "white",
          borderRadius: "50%",
          minWidth: "32px",
          height: "32px",
        }}
      >
        <GrDuplicate size={12} />
      </Button>
    </Box>
  );
};

export default PatternManager;
