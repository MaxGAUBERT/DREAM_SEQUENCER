import React, { useState } from "react";
import { Menu, MenuItem, Button, Stack, Box } from "@mui/material";
import { itemsToMapForDisplay } from "../Contexts/ItemsToMapForDisplay"; // Assurez-vous que ce chemin est correct

const StripMenu = ({ componentsMap, handleClickOnItem, openComponents, setOpenComponents, onMouseEnter: infos, onMouseLeave }) => {
  const [fileAnchor, setFileAnchor] = useState(null);
  const [editAnchor, setEditAnchor] = useState(null);
  const [viewAnchor, setViewAnchor] = useState(null);
  const [toolsAnchor, setToolsAnchor] = useState(null);

  const items = itemsToMapForDisplay();

  const handleOpenMenu = (setter) => (event) => setter(event.currentTarget);
  const handleCloseMenu = (setter) => () => setter(null);

  const handleOpenComponent = (component) => {
    setOpenComponents((prev) => ({
      ...prev,
      [component]: !prev[component], // toggle l'affichage
    }));
    setViewAnchor(null);
    setToolsAnchor(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: "absolute",
          top: 0,
          left: 80,
          backgroundColor: "#1e1e1e",
          padding: "2px",
          boxShadow: "0px 4px 10px rgba(255, 255, 255, 0.5)",
          zIndex: 1000,
        }}
      >
        {/* FILE */}
        <Button variant="contained" sx={buttonStyle} onClick={handleOpenMenu(setFileAnchor)}>
          File
        </Button>
        <Menu key={items} anchorEl={fileAnchor} open={Boolean(fileAnchor)} onClose={handleCloseMenu(setFileAnchor)}>
          <MenuItem onMouseEnter={() => infos("New")} onClick={() => handleClickOnItem("New")}>New</MenuItem>
          <MenuItem onMouseEnter={() => infos("Save As")} onClick={() => handleClickOnItem("Save As")}>Save As</MenuItem>
          <MenuItem onMouseEnter={() => infos("Save")} onClick={() => handleClickOnItem("Save")}>Save</MenuItem>
          <MenuItem onMouseEnter={() => infos("Load")} onClick={() => handleClickOnItem("Load")}>Load</MenuItem>
          <MenuItem onMouseEnter={() => infos("Settings")} onClick={() => handleClickOnItem("Settings")}>Settings</MenuItem>
          <MenuItem onMouseEnter={() => infos("Quit")} onClick={() => handleClickOnItem("Quit")}>Quit</MenuItem>
        </Menu>

        {/* EDIT */}
        <Button variant="contained" sx={buttonStyle} onClick={handleOpenMenu(setEditAnchor)}>
          Edit
        </Button>
        <Menu anchorEl={editAnchor} open={Boolean(editAnchor)} onClose={handleCloseMenu(setEditAnchor)}>
          <MenuItem onClick={handleCloseMenu(setEditAnchor)}>Undo</MenuItem>
          <MenuItem onClick={handleCloseMenu(setEditAnchor)}>Redo</MenuItem>
        </Menu>

        {/* VIEW */}
        <Button variant="contained" sx={buttonStyle} onClick={handleOpenMenu(setViewAnchor)}>
          View
        </Button>
        <Menu anchorEl={viewAnchor} open={Boolean(viewAnchor)} onClose={handleCloseMenu(setViewAnchor)}>
          <MenuItem onMouseEnter={() => infos("Channel Rack")}onClick={() => handleOpenComponent("ChannelRack")}>ChannelRack</MenuItem>
          <MenuItem onMouseEnter={() => infos("Browser")}onClick={() => handleOpenComponent("Browser")}>Browser</MenuItem>
          <MenuItem onMouseEnter={() => infos("Playlist")}onClick={() => handleOpenComponent("Playlist")}>Playlist</MenuItem>
        </Menu>

        {/* TOOLS */}
        <Button variant="contained" sx={buttonStyle} onClick={handleOpenMenu(setToolsAnchor)}>
          Tools
        </Button>
        <Menu anchorEl={toolsAnchor} open={Boolean(toolsAnchor)} onClose={handleCloseMenu(setToolsAnchor)}>
          <MenuItem onMouseEnter={() => infos("AnalogSynth")}onClick={() => handleOpenComponent("AnalogSynth")}>Analog Synth</MenuItem>
          <MenuItem onMouseEnter={() => infos("Modulator")}onClick={() => handleOpenComponent("Modulator")}>Modulator</MenuItem>
        </Menu>
      </Stack>

      {/* Composants actifs affichés */}
      {Object.entries(openComponents).map(([componentName, isOpen]) => (
        isOpen && componentsMap[componentName] ? (
          <Box
            key={componentName}
           
          >
            {componentsMap[componentName]}
          </Box>
        ) : null
      ))}
    </Box>
  );
};

const buttonStyle = {
  color: "white",
  backgroundColor: "gray",
  transition: "ease 0.3s",
  "&:hover": {
    backgroundColor: "gray",
    transform: "scale(1.2)",
    boxShadow: "0 4px 8px rgba(219, 219, 219, 0.8)",
  },
};

export default StripMenu;
