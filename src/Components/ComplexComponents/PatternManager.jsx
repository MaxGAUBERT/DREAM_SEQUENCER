import React, { useState } from "react";
import { GrDuplicate } from "react-icons/gr";
import {
  Box,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Menu,
  IconButton
} from "@mui/material";
import { FaPlus, FaMinus } from "react-icons/fa6";
import MoreVertIcon from "@mui/icons-material/MoreVert"; // Icône de menu

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
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        position: "fixed",
        top: 25,
        left: "55%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "gray",
        display: "flex",
        flexDirection: "row",
        gap: 1,
        height: "auto",
        zIndex: 1,
        flexWrap: "wrap",
      }}
    >
      {/* Sélecteur de pattern */}
      <FormControl sx={{ minWidth: 110 }} size="small">
        <Select
          value={selectedPattern?.id?.toString() || ""}
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
            if (selected && typeof selectPattern === "function") {
              selectPattern(selected);
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

      {/* Menu déroulant pour les actions */}
      <Box>
        <IconButton
          onClick={handleOpenMenu}
          sx={{
            backgroundColor: "gray.800",
            color: "white",
            width: 28,
            height: 28,
            position: "relative",
            "&:hover": {
              backgroundColor: "gray.900",
            }
          }}
        >
          <MoreVertIcon fontSize="medium"/>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <MenuItem
            onClick={() => {
              addPattern();
              handleCloseMenu();
            }}
          >
            <FaPlus style={{ marginRight: 8 }} />
            Add
          </MenuItem>
          <MenuItem
            onClick={() => {
              deletePattern();
              handleCloseMenu();
            }}
          >
            <FaMinus style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
          <MenuItem
            onClick={() => {
              duplicatePattern();
              handleCloseMenu();
            }}
          >
            <GrDuplicate style={{ marginRight: 8 }} />
            Duplicate
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default PatternManager;
