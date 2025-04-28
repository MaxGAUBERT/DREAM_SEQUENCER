import React, {useState, useEffect, useContext} from "react";
import { Button, Box, Typography, Input } from "@mui/material";
import {styled} from "@mui/material/styles";
import * as Tone from "tone";
import { MdAdd, MdDelete } from "react-icons/md";
import { MdCancel } from "react-icons/md";
import { GiConfirmed } from "react-icons/gi";
import { CgPiano } from "react-icons/cg";
import { FaFileUpload } from "react-icons/fa";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import PianoRoll from "./PianoRoll";
import { ColorContext } from "../Contexts/ColorProvider";

const ChannelRack = ({onSamplesUpdated, onUrlUpdated, onGridsUpdated, onPatternsUpdated, patterns, selectedPattern, stepRow, resetFlag, onMouseEnter, onMouseLeave, onColsChange}) => {
    const listOfInstruments = {"Kick": null, "Snare": null, "Hihat": null, "Clap": null};
    const suggestions = ["FX", "Synth", "Vocal", "Cymbals", "Bass"];
    const [channels, setChannels] = useState(listOfInstruments);
    const [channelSources, setChannelSources] = useState({});
    const [newChannelName, setNewChannelName] = useState("");
    const [renamedChannel, setRenamedChannel] = useState("");
    const [showInputChName, setShowInputChName] = useState(false);
    const [showPianoRoll, setShowPianoRoll] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null || Object.keys(channels)[0]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showRename, setShowRename] = useState(false);
   
    const [noteToFill, setNoteToFill] = useState(null);
    const [fill, setFill] = useState(null);
    const [rows, setRows] = useState(8);
    const [cols, setCols] = useState(16);

    const {colors} = useContext(ColorContext);

    const createEmptyGrid = () => Array.from({ length: rows }, () => Array(cols).fill(false));

    const filteredSuggestions = suggestions.filter(suggestion => 
        suggestion.toLowerCase().includes((newChannelName|| "").toLowerCase())
    );

    const [grids, setGrids] = useState(
    Object.keys(channels).reduce((acc, instrument) => {
            acc[instrument] = createEmptyGrid();
            return acc;
        }, {})
    );

    const handleColsChange = (newCols) => {
        setCols(newCols);
        // Notify parent component
        if (onColsChange) {
          onColsChange(newCols);
        }
    };

    useEffect(() => {
        setGrids(prev => {
          const updated = { ...prev };
      
          Object.keys(prev).forEach(instrument => {
            const currentGrid = prev[instrument] || [];
      
            const newGrid = Array.from({ length: rows }, (_, rowIdx) =>
              Array.from({ length: cols }, (_, colIdx) =>
                currentGrid[rowIdx]?.[colIdx] || false
              )
            );
      
            updated[instrument] = newGrid;
          });
      
          return updated;
        });
    }, [rows, cols]);
    
    /*
    const restorePlayersFromSources = (sources) => {
        const restored = {};
        Object.keys(sources).forEach(channel => {
          restored[channel] = new Tone.Sampler({
            urls: { C4: sources[channel] },
            release: 1,
          }).toDestination();
        });
        setChannels(restored);
    };
    */
      
      

    const handleFillSteps = (note, fill, selectedInstrument) => {
        console.log("Filling with:", note, fill, selectedInstrument);
    
        // correspondance des noms de notes aux index de ligne
        const noteToRowIndex = {
            "C4": 0,
            "D4": 1,
            "E4": 2,
            "F4": 3,
            "G4": 4,
            "A4": 5,
            "C5": 6,
            "A5": 7
        };
    
        const rowIndex = noteToRowIndex[note];
        
        // Récupérer le nombre total de colonnes (steps)
        const totalSteps = cols;
    
        const defaultRow = new Array(totalSteps).fill(false);
    
        setGrids(prevGrids => {
            const updatedGrids = { ...prevGrids };
    
            if (!updatedGrids[selectedInstrument]) {
                updatedGrids[selectedInstrument] = Array(8).fill().map(() => [...defaultRow]);
            }
    
            updatedGrids[selectedInstrument] = updatedGrids[selectedInstrument].map((row, idx) => {
                if (idx !== rowIndex) return row;
    
                // Réinitialiser la ligne
                const newRow = [...row].fill(false);
                
                if (fill === "All steps") {
                    // Remplir tous les pas
                    return newRow.fill(true);
                } 
                else if (fill.includes("1/")) {
                    // Pour les fractions (1/8, 1/4, 1/2)
                    const divisor = parseInt(fill.split('/')[1]);
                    const notesCount = Math.max(1, Math.floor(totalSteps / divisor));
                    
                    // Calculer l'intervalle entre chaque note
                    const interval = Math.floor(totalSteps / notesCount);
                    
                    // Placer les notes à intervalles réguliers
                    for (let i = 0; i < totalSteps; i += interval) {
                        newRow[i] = true;
                    }
                    return newRow;
                } 
                else {
                    // Pour les autres cas (1, 2, 4, 8 steps)
                    const stepValue = parseInt(fill.split(' ')[0]);
                    
                    for (let i = 0; i < totalSteps; i += stepValue) {
                        newRow[i] = true;
                    }
                    return newRow;
                }
            });
            onGridsUpdated(updatedGrids);
            return updatedGrids;
        });
    };
    const handleRenameChannel = (selected, renamed) => {
        if (!selected) return;
        
        // Mise à jour des canaux en préservant l'ordre
        setChannels((prev) => {
          // Créer un nouvel objet pour stocker les canaux dans l'ordre
          const updated = {};
          
          // Parcourir les canaux existants dans leur ordre actuel
          Object.keys(prev).forEach(channelName => {
            if (channelName === selected) {
              // Remplacer le canal sélectionné par le canal renommé
              updated[renamed] = prev[selected];
            } else {
              // Conserver les autres canaux tels quels
              updated[channelName] = prev[channelName];
            }
          });
          
          return updated;
        });
      
        // Mise à jour des grilles avec la même logique de préservation d'ordre
        setGrids((prev) => {
          const updated = {};
          
          Object.keys(prev).forEach(gridName => {
            if (gridName === selected) {
              updated[renamed] = prev[selected];
            } else {
              updated[gridName] = prev[gridName];
            }
          });
          
          return updated;
        });
      
        // Mise à jour du canal sélectionné
        setSelectedChannel(renamed);
      
        // Nettoyage
        setRenamedChannel("");
        setShowRename(false);
      };
      
      
    
    

    useEffect(() => {
        onSamplesUpdated(channels);
        onGridsUpdated(grids);
        onPatternsUpdated(patterns);

    }, [channels, grids, patterns]);

    useEffect(() => {
        if (resetFlag) {
            setChannels(listOfInstruments);
            setGrids(Object.keys(channels).reduce((acc, instrument) => {
                acc[instrument] = createEmptyGrid();
                return acc;
            }, {}));
        }
    }, [resetFlag]);

    // Synchroniser les grilles avec le pattern sélectionné
    useEffect(() => {
        if (selectedPattern && selectedPattern.grids) {
          setGrids(selectedPattern.grids);
        }
    }, [selectedPattern]);

    // Synchroniser les joueurs avec le pattern sélectionné
    useEffect(() => {
        if (selectedPattern && selectedPattern.players) {
            // Ne pas écraser complètement les joueurs car ils contiennent les samplers
            // Mais s'assurer que tous les instruments du pattern existent
            setChannels(prev => {
                const updatedPlayers = { ...prev};
                
                // S'assurer que tous les instruments du pattern existent
                Object.keys(selectedPattern.players).forEach(instrument => {
                    if (!updatedPlayers[instrument]) {
                        updatedPlayers[instrument] = null;
                    }
                });
                
                return updatedPlayers;
            });
        }
    }, [selectedPattern]);

      

    const handleGridToggle = (instrument, noteIndex, stepIndex) => {
        if (!instrument || !selectedPattern) return;
        
        // Mettre à jour les grilles locales
        setGrids(prevGrids => {
            const newGrids = { ...prevGrids };
            
            if (!newGrids[instrument]) {
                newGrids[instrument] = Array.from({ length: rows }, () => Array(cols).fill(false));
            }
            
            newGrids[instrument] = ensureGridSize(newGrids[instrument]).map((row, rowIdx) =>
                rowIdx === noteIndex
                  ? row.map((cell, idx) => idx === stepIndex ? !cell : cell)
                  : [...row]
            );
              
            
            // Notifier le parent de la mise à jour des grilles
            onGridsUpdated(newGrids);
            
            return newGrids;
        });
    };

    // Fonction améliorée pour gérer le drop
    const handleDrop = (e, channelName) => {
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");
        
        // Récupérer l'URL du sample
        const sampleUrl = e.dataTransfer.getData("text/plain");
        
        console.log("Drop received for channel:", channelName);
        console.log("Sample URL from drop:", sampleUrl);
        
        if (sampleUrl) {
            handleLoadDroppedSample(channelName, sampleUrl);
        } else {
            console.error("No sample URL found in drop data");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        // Permettre le drop
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("drag-over");
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");
    };

    const handleLoadDroppedSample = (channelName, sampleURL) => {
        if (!sampleURL || !channelName) {
            console.error("Missing sample URL or channel name");
            return;
        }
        
        console.log(`Loading sample into channel ${channelName}:`, sampleURL);
        
        try {
            // Créer un nouveau sampler avec l'URL du sample
            const sampler = new Tone.Sampler({
                urls: { C4: sampleURL },
                release: 1,
                onload: () => console.log(`Sample loaded successfully for ${channelName}`),
                onerror: (err) => console.error(`Error loading sample for ${channelName}:`, err)
            }).toDestination();
            
            // Mettre à jour le canal avec le nouveau sampler
            setChannels(prevChannels => {
                console.log(`Updating channel ${channelName} with new sampler`);
                return {
                    ...prevChannels,
                    [channelName]: sampler
                };
            });
        } catch (error) {
            console.error("Error creating sampler:", error);
        }
    };

    // Créer un nouveau canal
    const handleCreateNewChannel = () => {
        if (newChannelName === "") {
            return;
        }
    
        // Ajouter le nouveau canal à la liste
        setChannels((prevChannels) => {
            const updatedChannels = { ...prevChannels }; // Copie de l'objet
            updatedChannels[newChannelName] = null; // Ajoute le nouvel objet
            return updatedChannels;
        });

        setGrids((prevGrids) => ({
            ...prevGrids,
            [newChannelName]: createEmptyGrid(),
        }));

        setSelectedChannel(newChannelName);
    
        setNewChannelName("");
        setShowInputChName(!showInputChName);
    };
    
    const handleDisplayPianoRoll = (channel) => {
        setSelectedChannel(channel);
        setShowPianoRoll(!showPianoRoll);
    };

    const handleRemoveChannel = (channel) => {
        setChannels((prevChannels) => {
            const updatedChannels = { ...prevChannels };
            delete updatedChannels[channel];
    
            return updatedChannels;
        });
    
        setSelectedChannel((prevSelected) => {
            if (prevSelected === channel) {
                return null;
            }
            return prevSelected;
        });
    };
    
    // Charger un sample via file input
    const handleLoadSample = (channel, audioFile) => {
        if (!audioFile) return;
    
        const reader = new FileReader();
        reader.onload = (event) => {
            const audioUrl = event.target.result;
    
            const sampler = new Tone.Sampler({
                urls: { C4: audioUrl },
                release: 1,
            }).toDestination();
    
            setChannels((prevChannels) => ({
                ...prevChannels,
                [channel]: sampler
            }));

            setChannelSources(prev => ({
                ...prev,
                [channel]: audioUrl
            }));
            
            onUrlUpdated(channelSources);
        };
    
        reader.readAsDataURL(audioFile);
    };

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
    
    const selectSuggestion = (suggestion) => {
        setNewChannelName(suggestion);
        setShowSuggestions(false);
    };


    const checkInputCreateChannel = () => {
        if (!showRename) {
            setShowInputChName(!showInputChName)
        } else {
            return;
        }
    }

    const handleClearGrid = (selectedChannel) => {
        setGrids((prevGrids) => ({
            ...prevGrids,
            [selectedChannel]: createEmptyGrid(),
        }))

        onGridsUpdated({
            ...prevGrids,
            [selectedChannel]: createEmptyGrid(),
        });
          
    }

    const ensureGridSize = (grid) => {
        if (!grid) {
            return Array.from({ length: rows }, () => Array(cols).fill(false));
        }
    
        return Array.from({ length: rows }, (_, rowIdx) =>
          Array.from({ length: cols }, (_, colIdx) =>
            grid?.[rowIdx]?.[colIdx] || false
          )
        );
      };
      
    const getResizedGrid = (grid) => {
        return ensureGridSize(grid);
    };
      

    return (
        <Box onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} sx={{
            border: "10px inset white",
            borderRadius: "8px",
            color: "black",                   
            boxSizing: "border-box",
            bgcolor: colors.channelRackColor,
            position: "absolute",
            top: 60,
            right: 0,
            maxHeight: "850px",
            overflow: "auto",
        }}>
            <Typography variant="h5" sx={{ fontFamily: "Silkscreen, cursive"}}>Channel Rack</Typography>
            
            {/* Liste des canaux */}
            {Object.keys(channels).map((channelName, index) => (
                <Box
                    key={index}
                    onDrop={(e) => handleDrop(e, channelName)}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                        border: "1px dashed white",
                        padding: "4px",
                        transition: "all 0.2s ease",
                        '&.drag-over': {
                            backgroundColor: "#4a4a4a",
                            borderColor: "#00aaff",
                            borderStyle: "solid"
                        }
                    }}
                    
                >
                    <Typography
                        variant="body1"
                        sx={{
                            width: "120px",
                            fontFamily: "Silkscreen, cursive",
                            color: "black",
                        }}
                    >
                        {index + 1} - {channelName}
                    </Typography>
                    

                    <Button
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    startIcon={<FaFileUpload size={20} />}
                    sx={{ fontFamily: "Arial", color: "black", fontSize: 10 }}
                    >
                    {channels[channelName] ? "Replace" : "Load"}
                    <VisuallyHiddenInput
                        type="file"
                        accept="audio/*"
                        onChange={(event) => handleLoadSample(channelName, event.target.files[0])}
                        multiple
                    />
                    </Button>

                    <Button
                        sx={{ fontFamily: "Arial", color: "black" }}
                        onClick={() => handleDisplayPianoRoll(channelName)}
                    >
                        <CgPiano size={25} />
                    </Button>

                    <Button
                    sx={{ fontFamily: "Arial", color: "black" }}
                    onClick={() => {
                        setSelectedChannel(channelName); // définit le canal à renommer
                        setShowRename(true);             // affiche le champ de renommage
                    }}
                    >
                    <MdOutlineDriveFileRenameOutline size={25} />
                    </Button>


                    <Button
                        sx={{ fontFamily: "Arial", color: "black" }}
                        onClick={() => handleRemoveChannel(channelName)}
                    >
                        <MdDelete size={25} />
                    </Button>
                </Box>
            ))}

            {showRename && selectedChannel && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Input
                type="text"
                placeholder={`Rename "${selectedChannel}"`}
                value={renamedChannel}
                onChange={(e) => setRenamedChannel(e.target.value)}
                sx={{ color: "black" }}
                />
               <Button
                    onClick={() => handleRenameChannel(selectedChannel, renamedChannel)}
                    disabled={!renamedChannel || renamedChannel === selectedChannel}
                >

                <GiConfirmed size={20} color="green" /> Rename
                </Button>
            </Box>
            )}


            {/* Bouton pour ajouter un nouveau canal */}
            <Button onClick={checkInputCreateChannel}>
                {showInputChName ? <MdCancel size={20} /> : <MdAdd size={20}/>}
            </Button> 

            {/* Formulaire pour créer un nouveau canal */}
            {showInputChName && (
                <Box>
                    <Input
                        type="text"
                        placeholder="Channel name"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        sx={{color: "black"}}
                    />
                    <Button onClick={handleCreateNewChannel}><GiConfirmed size={20} color="green"/> Create </Button>
                </Box>
            )}

            {/* Suggestions pour les noms de canaux */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <Box sx={{ flexDirection: "row", display: "flex" }}>
                {filteredSuggestions.map((suggestion, index) => (
                    <div
                    key={index}
                    style={{
                        padding: "12px 12px",
                        cursor: "pointer",
                        hover: {
                        backgroundColor: "red"
                        }
                    }}
                    onMouseDown={() => selectSuggestion(suggestion)}
                    >
                    {suggestion}
                    </div>
                ))}
                </Box>
            )}

            {/* Affichage du piano roll */}
            <Box>
                {showPianoRoll && Object.keys(channels).length > 0 && (
                    
                <PianoRoll
                channel={channels}
                grid={getResizedGrid(grids[selectedChannel])}
                clearGrid={() => handleClearGrid(selectedChannel)}
                instrument={selectedChannel}
                onGridToggle={(noteIndex, stepIndex) =>
                    handleGridToggle(selectedChannel, noteIndex, stepIndex)
                }
                noteMode={setNoteToFill}
                fillMode={setFill}
                onFillSteps={() => handleFillSteps(noteToFill, fill, selectedChannel)}
                stepRow={stepRow}
                channels={Object.keys(channels)}
                selectedInstrument={selectedChannel}
                onInstrumentChange={setSelectedChannel}
                numRows={rows}
                numCols={cols}
                setRows={setRows}
                setCols={setCols}
                onColsChange={handleColsChange} 
                />
                )}
            </Box>
        </Box>
    );
};

export default ChannelRack;

