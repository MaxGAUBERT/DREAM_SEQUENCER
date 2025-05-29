import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Button, Box, Typography, Input } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as Tone from "tone";
import { MdAdd, MdDelete, MdCancel, MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { GiConfirmed } from "react-icons/gi";
import { CgPiano } from "react-icons/cg";
import { FaFileUpload } from "react-icons/fa";
import PianoRoll from "./PianoRoll";
import { ColorContext } from "../Contexts/ColorProvider";
import { itemsToMapForDisplay } from "../Contexts/ItemsToMapForDisplay";
import { RiResetLeftFill } from "react-icons/ri";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const defaultInstruments = { Kick: null, Snare: null, Hihat: null, Clap: null };
const suggestions = ["FX", "Synth", "Vocal", "Cymbals", "Bass", "Kick", "Snare", "Hihat", "Clap", "Flute"];

const ChannelRack = React.memo(({
  onSamplesUpdated, onUrlUpdated, onGridsUpdated, onPatternsUpdated,
  patterns, selectedPattern, stepRow, resetFlag,
  onMouseEnter: infos, onMouseLeave, onColsChange, isPlaying
}) => {
  const { colors } = useContext(ColorContext);
  const [channels, setChannels] = useState(defaultInstruments);
  const [channelSources, setChannelSources] = useState({});
  const [newChannelName, setNewChannelName] = useState("");
  const [renamedChannel, setRenamedChannel] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(Object.keys(defaultInstruments)[0]);
  const [showInput, setShowInput] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [rows, setRows] = useState(30);
  const [cols, setCols] = useState(50);

  const {items} = itemsToMapForDisplay();

  const createEmptyGrid = () => Array.from({ length: rows }, () => Array(cols).fill(false));
  const filteredSuggestions = useMemo(() =>
    suggestions.filter(s => s.toLowerCase().includes(newChannelName.toLowerCase())), [newChannelName]);

  const [grids, setGrids] = useState(() =>
    Object.fromEntries(Object.keys(channels).map(key => [key, createEmptyGrid()]))
  );
  
  const updateGrids = (updateFn) => {
    setGrids(prev => {
      const updated = updateFn(prev);
      onGridsUpdated(updated);
      return updated;
    });
  };
  

  const handleCopy = () => {
    // copier les notes de la grille sélectionnée
    const selectedGrid = grids[selectedChannel];
    const copiedNotes = selectedGrid.map(row => row.map(cell => (cell ? 1 : 0)));
    navigator.clipboard.writeText(JSON.stringify(copiedNotes));
  };

  const handlePaste = () => {
    // coller les notes copiées dans la grille sélectionnée
    navigator.clipboard.readText().then(text => {
      try {
        const pastedNotes = JSON.parse(text);
        if (pastedNotes.length === rows && pastedNotes[0].length === cols) {
          updateGrids(prev => ({
            ...prev,
            [selectedChannel]: pastedNotes.map((row, rIdx) =>
              row.map((cell, cIdx) => (cell ? true : prev[selectedChannel][rIdx][cIdx]))
            )
          }));
        } else {
          console.error("Invalid pasted grid size");
        }
      } catch (error) {
        console.error("Failed to parse pasted notes", error);
      }
    });
  };

  const handleRenameChannel = () => {
  if (!selectedChannel || !renamedChannel) return;
  
  // Préserver l'ordre des canaux en créant un nouvel objet ordonné
  setChannels(prev => {
    const entries = Object.entries(prev);
    const result = {};
    
    // Reconstruire l'objet avec le même ordre, mais en remplaçant le nom du canal
    for (const [key, value] of entries) {
      if (key === selectedChannel) {
        result[renamedChannel] = value;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  });
  
  // Faire de même pour les grids
  updateGrids(prev => {
    const entries = Object.entries(prev);
    const result = {};
    
    for (const [key, value] of entries) {
      if (key === selectedChannel) {
        result[renamedChannel] = value;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  });
  
  setSelectedChannel(renamedChannel);
  setRenamedChannel("");
  setShowRename(false);
};

  const handleCreateChannel = () => {
    if (!newChannelName) return;
    setChannels(prev => ({ ...prev, [newChannelName]: null }));
    setGrids(prev => ({ ...prev, [newChannelName]: createEmptyGrid() }));
    setSelectedChannel(newChannelName);
    setNewChannelName("");
    setShowInput(false);
  };

  const handleLoadSample = (channel, audioFile) => {
    if (!audioFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      const sampler = new Tone.Sampler({ urls: { C4: url }, release: 1 }).toDestination();
      setChannels(prev => ({ ...prev, [channel]: sampler }));
      setChannelSources(prev => ({ ...prev, [channel]: url }));
      onUrlUpdated({ ...channelSources, [channel]: url });
      //onSamplesUpdated({ ...channels, [channel]: sampler });
    };
    reader.readAsDataURL(audioFile);
  };
  
  const handleGridToggle = useCallback((inst, rowIdx, colIdx) => {
    updateGrids(prev => ({
      ...prev,
      [inst]: ensureGridSize(prev[inst]).map((row, idx) =>
        idx === rowIdx ? row.map((cell, i) => (i === colIdx ? !cell : cell)) : row
      )
    }));
  }, []);
  

   const handleRemoveChannel = (channelId) => {
    if (!channelId) return;

    setShowSuggestions(false);
    setShowInput(false);

    setChannels(prev => {
      const updated = { ...prev };
      delete updated[channelId];
      
      // Si le canal supprimé était le canal sélectionné,
      // sélectionner le premier canal disponible s'il y en a
      if (channelId === selectedChannel) {
        const remainingChannels = Object.keys(updated);
        if (remainingChannels.length > 0) {
          setSelectedChannel(remainingChannels[0]);
        } else {
          setSelectedChannel(null);
        }
      } else if (channelId !== selectedChannel) {
        const remainingChannels = Object.keys(updated);
        setSelectedChannel(prev => (remainingChannels.includes(prev) ? prev : remainingChannels[0]));
      }
        
      
      return updated;
    });
  };

  const ensureGridSize = (grid) => {
  if (!grid || !Array.isArray(grid)) {
    return Array.from({ length: rows }, () => Array(cols).fill(false));
  }
  
  return Array.from({ length: rows }, (_, rowIdx) =>
    Array.from({ length: cols }, (_, colIdx) => 
      grid[rowIdx] && grid[rowIdx][colIdx] !== undefined 
        ? grid[rowIdx][colIdx] 
        : false
    )
  );
};


  useEffect(() => {
    onSamplesUpdated(channels);
    onGridsUpdated(grids);
    onPatternsUpdated(patterns);
  }, [channels, grids, patterns]);

  useEffect(() => {
    if (resetFlag) {
      setChannels(defaultInstruments);
      setGrids(Object.fromEntries(Object.keys(defaultInstruments).map(i => [i, createEmptyGrid()])));
    }
  }, [resetFlag]);

  useEffect(() => {
    if (selectedPattern?.grids) setGrids(selectedPattern.grids);
    if (selectedPattern?.players) {
      setChannels(prev => {
        const updated = { ...prev };
        for (const inst in selectedPattern.players) if (!updated[inst]) updated[inst] = null;
        return updated;
      });
    }
  }, [selectedPattern]);

  return (
    <Box key={items} sx={{
      border: "8px inset white", borderRadius: 1, bgcolor: colors.channelRackColor,
      position: "fixed", top: 60, right: 0, maxHeight: "850px", overflow: "auto", maxWidth: "370px"
    }}>
      <Typography onMouseLeave={onMouseLeave} nMouseEnter={() => infos("ChannelRack")} variant="h5" sx={{ fontFamily: "Silkscreen, cursive" }}>Channel Rack</Typography>

      {/* Canaux */}
      {Object.entries(channels).map(([name], i) => (
        <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
          <Typography sx={{ width: "120px", fontFamily: "Silkscreen, cursive" }}>{i + 1} - {name}</Typography>

          <Button onMouseLeave={onMouseLeave}onMouseEnter={() => infos("ChRackUpload")} component="label" variant="contained" color="gray" startIcon={<FaFileUpload size={15}/>} sx={{ fontSize: 10 }}>
            {channels[name] ? "Replace" : "Load"}
            <VisuallyHiddenInput type="file" accept="audio/*" onChange={e => handleLoadSample(name, e.target.files[0])} />
          </Button>

          <Button  onMouseLeave={onMouseLeave} onMouseEnter={() => infos("ChRackPiano")} onClick={() => { setSelectedChannel(name); setShowPianoRoll(!showPianoRoll); }}><CgPiano size={25} color="black"/></Button>
          <Button  onMouseLeave={onMouseLeave} onMouseEnter={() => infos("ChRackRename")} onClick={() => { setSelectedChannel(name); setShowRename(true); }}><MdOutlineDriveFileRenameOutline size={25} color="black"/></Button>
          <Button  onMouseLeave={onMouseLeave} onMouseEnter={() => infos("ChRackDelete")} disabled={showRename} onClick={() => handleRemoveChannel(name)}><MdDelete size={25} color="black"/></Button>
        </Box>
      ))}

      {/* Renommage */}
      {showRename && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Input placeholder={`Rename "${selectedChannel}"`} value={renamedChannel} onChange={e => setRenamedChannel(e.target.value)} />
          <Button onClick={handleRenameChannel} disabled={!renamedChannel || renamedChannel === selectedChannel || Object.keys(channels).length === 0}><GiConfirmed size={20} /> Rename</Button>
        </Box>
      )}

      {/* Ajout */}
      <Button onMouseEnter={() => infos("ChRackAdd")} onMouseLeave={onMouseLeave} onClick={() => !showRename && setShowInput(p => !p)}>
        {showInput ? <MdCancel size={20} /> : <MdAdd size={25} />}
      </Button>
      
      {Object.keys(channels).length === 0 && (
      <Button onMouseEnter={() => infos("ChReset")} onMouseLeave={onMouseLeave} onClick={() => setChannels(defaultInstruments)}>
        <RiResetLeftFill size={25} />
      </Button>
      )}
      {showInput && (
        <Box>
          <Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} onFocus={() => setShowSuggestions(true)} />
          <Button onMouseLeave={onMouseLeave} onMouseEnter={() => infos("ChRackCreate")} onClick={handleCreateChannel}><GiConfirmed size={20}/> Create </Button>
        </Box>
      )}

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Box sx={{ display: "flex", overflow: "auto"}}>
          {filteredSuggestions.map((s, i) => (
            <Button key={i} sx={{ fontSize: 10, borderRadius: 1, border: "2px solid white" }} onMouseDown={() => { setNewChannelName(s); setShowSuggestions(false); }}>{s}</Button>
          ))}
        </Box>
      )}

      {/* Piano Roll */}
      {showPianoRoll && selectedChannel && (
        <PianoRoll
          grid={ensureGridSize(grids[selectedChannel])}
          onGridToggle={(r, c) => handleGridToggle(selectedChannel, r, c)}
          rows={rows}
          cols={cols}
          onColsChange={setCols}
          onClearGrid={() => updateGrids(prev => ({ ...prev, [selectedChannel]: createEmptyGrid() }))}
          onCopy={handleCopy}
          onPaste={handlePaste}
          selectedInstrument={selectedChannel}
          isPlaying={isPlaying}
        />
      )}
    </Box>
  );
});

export default ChannelRack;