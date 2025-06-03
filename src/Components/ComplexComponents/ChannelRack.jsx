import React, { useState, useEffect, useMemo, useCallback } from "react";
import { styled } from "@mui/material/styles";
import * as Tone from "tone";
import { MdAdd, MdDelete, MdCancel, MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { GiConfirmed } from "react-icons/gi";
import { CgPiano } from "react-icons/cg";
import { FaFileUpload } from "react-icons/fa";
import PianoRoll from "./PianoRoll";
import { useColors } from "../Contexts/ColorProvider";
import { itemsToMapForDisplay } from "../Contexts/ItemsToMapForDisplay";
import { RiResetLeftFill } from "react-icons/ri";




const defaultInstruments = { Kick: null, Snare: null, Hihat: null, Clap: null };
const suggestions = ["FX", "Synth", "Vocal", "Cymbals", "Bass", "Kick", "Snare", "Hihat", "Clap", "Flute"];

const ChannelRack = React.memo(({
  onSamplesUpdated, onUrlUpdated, onGridsUpdated, onPatternsUpdated,
  patterns, selectedPattern, resetFlag,
  onMouseEnter: infos, onMouseLeave, isPlaying
}) => {
  const { colors } = useColors();
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

  // ==================== DRAG & DROP LOGIC ====================
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e, channelName) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    try {
      let sampleData;
      const jsonData = e.dataTransfer.getData("application/json");
      const sampleJsonData = e.dataTransfer.getData("text/sample-data");
      
      if (jsonData) {
        sampleData = JSON.parse(jsonData);
      } else if (sampleJsonData) {
        sampleData = JSON.parse(sampleJsonData);
      } else {
        const url = e.dataTransfer.getData("text/plain");
        sampleData = { url, type: 'sample', name: 'Dropped Sample' };
      }
      
      if (sampleData.type === 'sample' || sampleData.url) {
        assignSampleToChannel(channelName, sampleData);
        console.log(`Sample ${sampleData.name} assigné au canal ${channelName}`);
      }
    } catch (error) {
      console.error("Erreur lors du drop:", error);
    }
  }, []);

  const assignSampleToChannel = useCallback(async (channelName, sampleData) => {
    try {
      await Tone.start();
      
      // Créer un sampler Tone.js avec le sample
      const sampler = new Tone.Sampler({ 
        urls: { C4: sampleData.url }, 
        release: 1 
      }).toDestination();
      
      // Mettre à jour les états
      setChannels(prev => ({ ...prev, [channelName]: sampler }));
      setChannelSources(prev => ({ 
        ...prev, 
        [channelName]: sampleData.url 
      }));
      
      // Notifier les composants parents
      onUrlUpdated(prev => ({ ...prev, [channelName]: sampleData.url }));
      
      console.log(`Sample ${sampleData.name} chargé dans le canal ${channelName}`);
    } catch (error) {
      console.error("Erreur lors du chargement du sample:", error);
    }
  }, [onUrlUpdated]);

  // ==================== EXISTING FUNCTIONS ====================
  const handleCopy = () => {
    const selectedGrid = grids[selectedChannel];
    const copiedNotes = selectedGrid.map(row => row.map(cell => (cell ? 1 : 0)));
    navigator.clipboard.writeText(JSON.stringify(copiedNotes));
  };

  const handlePaste = () => {
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

  const handleRenameChannel = useCallback(() => {
    if (!selectedChannel || !renamedChannel) return;
    
    setChannels(prev => {
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
  }, [selectedChannel, renamedChannel]);

  const handleCreateChannel = useCallback(() => {
    if (!newChannelName) return;
    setChannels(prev => ({ ...prev, [newChannelName]: null }));
    setGrids(prev => ({ ...prev, [newChannelName]: createEmptyGrid() }));
    setSelectedChannel(newChannelName);
    setNewChannelName("");
    setShowInput(false);
  }, [newChannelName]);

  const handleLoadSample = useCallback((channel, audioFile) => {
    if (!audioFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      const sampler = new Tone.Sampler({ urls: { C4: url }, release: 1 }).toDestination();
      setChannels(prev => ({ ...prev, [channel]: sampler }));
      setChannelSources(prev => ({ ...prev, [channel]: url }));
      onUrlUpdated({ ...channelSources, [channel]: url });
    };
    reader.readAsDataURL(audioFile);
  }, [channels, channelSources]);
  
  const handleGridToggle = useCallback((inst, rowIdx, colIdx) => {
    updateGrids(prev => ({
      ...prev,
      [inst]: ensureGridSize(prev[inst]).map((row, idx) =>
        idx === rowIdx ? row.map((cell, i) => (i === colIdx ? !cell : cell)) : row
      )
    }));
  }, []);

  const handleRemoveChannel = useCallback((channelId) => {
    if (!channelId) return;

    setShowSuggestions(false);
    setShowInput(false);

    setChannels(prev => {
      const updated = { ...prev };
      delete updated[channelId];
      
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
  }, [channels, selectedChannel]);

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

  // ==================== EFFECTS ====================
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
    <>
      {/* Styles CSS pour les effets de drag over */}
      <style jsx>{`
        .drag-over {
          background-color: rgba(59, 130, 246, 0.3) !important;
          border: 2px dashed #3b82f6 !important;
          transform: scale(1.02);
          transition: all 0.2s ease;
        }
        
        .channel-slot {
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        
        .channel-slot:hover {
          border-color: rgba(156, 163, 175, 0.5);
        }
      `}</style>

      <div
        key={items}
        className="fixed top-[60px] right-0 max-h-[550px] font-[silkscreen] overflow-y-auto max-w-[470px] border-8 border-white border-inset rounded p-2"
      >
        <h2
          onMouseLeave={onMouseLeave}
          onMouseEnter={() => infos("ChannelRack")}
          className="font-silkscreen text-xl text-white mb-4"
        >
          Channel Rack
        </h2>

        {/* Canaux avec zones de drop */}
        {Object.entries(channels).map(([name], i) => (
          <div 
            key={i} 
            className="channel-slot flex items-center gap-2 mb-2 w-90 p-2 rounded"
            style={{color: "white"}}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, name)}
          >
            <p className="w-[120px] font-silkscreen text-sm">
              {i + 1} - {name}
            </p>

            <label
              onMouseLeave={onMouseLeave}
              onMouseEnter={() => infos("ChRackUpload")}
              className="text-xs bg-gray-600 text-white px-2 py-1 rounded cursor-pointer flex items-center gap-1"
            >
              <FaFileUpload size={15} color={colors.regularButtonColor} />
              {channels[name] ? "Replace" : "Load"}
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={e => handleLoadSample(name, e.target.files[0])}
              />
            </label>

            <button
              onMouseLeave={onMouseLeave}
              onMouseEnter={() => infos("ChRackPiano")}
              onClick={() => {
                setSelectedChannel(name);
                setShowPianoRoll(!showPianoRoll);
              }}
            >
              <CgPiano size={25} color={colors.regularButtonColor} />
            </button>

            <button
              onMouseLeave={onMouseLeave}
              onMouseEnter={() => infos("ChRackRename")}
              onClick={() => {
                setSelectedChannel(name);
                setShowRename(true);
              }}
            >
              <MdOutlineDriveFileRenameOutline size={25} color={colors.regularButtonColor} />
            </button>

            <button
              onMouseLeave={onMouseLeave}
              onMouseEnter={() => infos("ChRackDelete")}
              disabled={showRename}
              onClick={() => handleRemoveChannel(name)}
            >
              <MdDelete size={25} color={colors.regularButtonColor}/>
            </button>

            {/* Indicateur visuel si sample chargé */}
            {channels[name] && (
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </div>
        ))}

        {/* Renommage */}
        {showRename && (
          <div className="flex items-center text-white gap-2 mb-2">
            <input
              type="text"
              placeholder={`Rename "${selectedChannel}"`}
              value={renamedChannel}
              onChange={e => setRenamedChannel(e.target.value)}
              className="border px-2 py-1 rounded text-black"
            />
            <button
              className="bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
              onClick={handleRenameChannel}
              disabled={
                !renamedChannel ||
                renamedChannel === selectedChannel ||
                Object.keys(channels).length === 0
              }
            >
              <GiConfirmed size={20} color={colors.regularButtonColor}/> Rename
            </button>
            <button
              className="bg-red-500 text-white px-2 py-1 rounded flex items-center disabled:opacity-50"
              onClick={() => setShowRename(false)}
            >
              <MdCancel size={20} color={colors.regularButtonColor}/> Cancel
            </button>
          </div>
        )}

        {/* Ajout */}
        <div className="flex gap-2 mb-2 justify-center">
          <button
            onMouseEnter={() => infos("ChRackAdd")}
            onMouseLeave={onMouseLeave}
            onClick={() => !showRename && setShowInput(p => !p)}
          >
            {showInput ? <MdCancel size={20} /> : <MdAdd size={25} color={colors.regularButtonColor}/>}
          </button>

          {Object.keys(channels).length === 0 && (
            <button
              onMouseEnter={() => infos("ChReset")}
              onMouseLeave={onMouseLeave}
              onClick={() => { setChannels(defaultInstruments); setGrids({})}}
            >
              <RiResetLeftFill size={25} color={colors.regularButtonColor}/>
            </button>
          )}
        </div>

        {showInput && (
          <div style={{color: colors.regularTextColor}} className="mb-2 flex flex-row gap-2">
            <input
              type="text"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="border text-black px-2 py-1 rounded w-30 h-15"
            />
            <button
              onMouseLeave={onMouseLeave}
              onMouseEnter={() => infos("ChRackCreate")}
              onClick={handleCreateChannel}
              className="bg-blue-500 w-15 h-15 text-white justify-center py-1 rounded flex items-center gap-1"
              disabled={!newChannelName}
            >
              <GiConfirmed size={20} color={colors.regularButtonColor} /> Create
            </button>
          </div>
        )}

        {/* Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="flex overflow-auto text-white gap-2 mb-2">
            {filteredSuggestions.map((s, i) => (
              <button
                key={i}
                className="text-xs border-2 text-white border-white rounded px-2 py-1"
                onMouseDown={() => {
                  setNewChannelName(s);
                  setShowSuggestions(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Instructions de drop */}
        <div className="text-xs text-gray-400 text-center mb-2">
          Drop samples onto channel slots to load them
        </div>

        {/* Piano Roll */}
        {showPianoRoll && selectedChannel && (
          <PianoRoll
            grid={ensureGridSize(grids[selectedChannel])}
            onGridToggle={(r, c) => handleGridToggle(selectedChannel, r, c)}
            rows={rows}
            cols={cols}
            onColsChange={setCols}
            onClearGrid={() =>
              updateGrids(prev => ({ ...prev, [selectedChannel]: createEmptyGrid() }))
            }
            onCopy={handleCopy}
            onPaste={handlePaste}
            selectedInstrument={selectedChannel}
            isPlaying={isPlaying}
          />
        )}
      </div>
    </>
  );
});

export default ChannelRack;