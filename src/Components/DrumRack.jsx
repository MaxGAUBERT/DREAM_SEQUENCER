import React, { useState, useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";
import { usePlayContext } from "../Contexts/PlayContext";
import { IoAddOutline } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import { GrClearOption } from "react-icons/gr";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext"; // adapte le chemin


const icon_size = 20;

const DrumRack = React.memo(({numSteps, setNumSteps, instrumentList, setInstrumentList, selectedPatternID}) => {
  const [input, setInput] = useState(false);
  const [instrumentName, setInstrumentName] = useState("");
  const { samplerRef, sequencesRef, isPlaying, setIsPlaying, bpm, setBpm } = usePlayContext();
  const { colorsComponent} = useGlobalColorContext();

  // CORRECTION : Redimensionner les grilles sans perdre les données
  useEffect(() => {
    if (!numSteps || numSteps < 4) return;

    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        if (!newList[inst].grids) {
          newList[inst].grids = {};
        }
        
        // Redimensionner TOUTES les grilles existantes en préservant les données
        Object.keys(newList[inst].grids).forEach(patternId => {
          const currentGrid = newList[inst].grids[patternId] || [];
          const newGrid = Array(numSteps).fill(false);
          
          // Copier les valeurs existantes jusqu'à la longueur minimale
          for (let i = 0; i < Math.min(currentGrid.length, numSteps); i++) {
            newGrid[i] = currentGrid[i];
          }
          
          newList[inst].grids[patternId] = newGrid;
        });
      });
      return newList;
    });
  }, [numSteps, setInstrumentList]);

  const handleAddInstrument = useCallback((e) => {
    e?.preventDefault?.();
    if (!instrumentName.trim()) return;

    setInstrumentList(prev => {
      const newInstrument = {
        value: null,
        checked: false,
        grids: {}
      };
      
      // Ajouter une grille pour chaque pattern existant, pas seulement le pattern sélectionné
      const existingPatternIds = Object.keys(prev).length > 0 
        ? Object.keys(Object.values(prev)[0].grids || {})
        : [selectedPatternID];
      
      existingPatternIds.forEach(patternId => {
        newInstrument.grids[patternId] = Array(numSteps).fill(false);
      });
      
      // Si le pattern sélectionné n'existe pas encore, l'ajouter
      if (!newInstrument.grids[selectedPatternID]) {
        newInstrument.grids[selectedPatternID] = Array(numSteps).fill(false);
      }

      return {
        ...prev,
        [instrumentName.trim()]: newInstrument
      };
    });
    
    setInput(false);
    setInstrumentName("");
  }, [instrumentName, setInstrumentList, numSteps, selectedPatternID]);

  const handleDeleteInstrument = useCallback(() => {
    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        if (newList[inst].checked) {
          delete newList[inst];
        }
      });
      return newList;
    });
  }, [setInstrumentList]);

  const toggleInstrumentCheck = useCallback((instrumentName, checked) => {
    setInstrumentList(prev => ({
      ...prev,
      [instrumentName]: {
        ...prev[instrumentName],
        checked: checked
      }
    }));
  }, [setInstrumentList]);
  
  const handleReset = useCallback(() => {
    // CORRECTION : Reset seulement le pattern courant, pas tous les patterns
    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        if (newList[inst].grids && newList[inst].grids[selectedPatternID]) {
          newList[inst].grids[selectedPatternID] = Array(numSteps).fill(false);
        }
      });
      return newList;
    });
  }, [setInstrumentList, selectedPatternID, numSteps]);

  const handleLoadSample = useCallback((instrument, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('audio/')) {
      console.error('Please select an audio file');
      return;
    }

    setInstrumentList(prev => {
      // Nettoyer l'ancien sample s'il existe
      const oldData = prev[instrument];
      if (oldData?.sampleUrl) {
        URL.revokeObjectURL(oldData.sampleUrl);
      }
      if (oldData?.sampler) {
        oldData.sampler.dispose();
      }

      const newUrl = URL.createObjectURL(file);
      
      // Créer le nouveau sampler
      const sampler = new Tone.Sampler({
        urls: { C4: newUrl },
        release: 1,
        onload: () => {
          console.log(`Sample loaded successfully for ${instrument}`);
        },
        onerror: (error) => {
          console.error(`Error loading sample for ${instrument}:`, error);
        }
      }).toDestination();

      return {
        ...prev,
        [instrument]: {
          ...prev[instrument],
          sampler,
          sampleUrl: newUrl,
          fileName: file.name
        }
      };
    });

    // Reset l'input file pour permettre de recharger le même fichier
    e.target.value = '';
  }, [setInstrumentList]);

  useEffect(() => {
    // Nettoyage systématique à chaque changement
    const cleanup = () => {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
      }
      Tone.Transport.cancel();
      sequencesRef.current.forEach(seq => {
        if (seq.state !== 'stopped') {
          seq.stop();
        }
        seq.dispose();
      });
      sequencesRef.current = [];
    };

    cleanup();

    // Si pas de lecture demandée, on s'arrête là
    if (!isPlaying) {
      return;
    }

    // Configuration du BPM
    Tone.Transport.bpm.value = bpm;
    
    let hasValidSequences = false;

    Object.entries(instrumentList).forEach(([instrumentName, instrumentData]) => {
      const pattern = instrumentData.grids?.[selectedPatternID];
      const sampler = instrumentData.sampler;

      // Vérifications plus strictes
      if (!sampler || !pattern || !Array.isArray(pattern)) {
        console.log(`Skip ${instrumentName}: no sampler or invalid pattern`);
        return;
      }

      // Vérifier si le pattern a au moins un step actif
      const hasActiveSteps = pattern.some(step => step === true);
      if (!hasActiveSteps) {
        console.log(`Skip ${instrumentName}: no active steps`);
        return;
      }

      try {
        const seq = new Tone.Sequence((time, stepIndex) => {
          if (pattern[stepIndex] === true) {
            // Vérifier que le sampler est toujours valide avant de jouer
            if (sampler && sampler.loaded) {
              sampler.triggerAttackRelease("C4", "8n", time);
            }
          }
        }, Array.from({ length: pattern.length }, (_, i) => i), "16n");

        seq.start(0);
        sequencesRef.current.push(seq);
        hasValidSequences = true;
        console.log(`Sequence created for ${instrumentName} with ${pattern.length} steps`);
      } catch (error) {
        console.error(`Error creating sequence for ${instrumentName}:`, error);
      }
    });

    // Démarrer le transport seulement s'il y a des séquences valides
    if (hasValidSequences) {
      try {
        Tone.Transport.start();
        console.log(`Transport started for pattern ${selectedPatternID}`);
      } catch (error) {
        console.error('Error starting transport:', error);
      }
    } else {
      console.log('No valid sequences to play');
    }

    // Cleanup au démontage
    return cleanup;
  }, [instrumentList, selectedPatternID, isPlaying, bpm]);

  const toggleStep = useCallback((instrumentName, stepIndex) => {
    if (selectedPatternID === null || selectedPatternID === undefined) return;
    
    setInstrumentList(prev => {
      const instrument = prev[instrumentName];
      if (!instrument) return prev;
      
      const grids = instrument.grids || {};
      const patternGrid = grids[selectedPatternID] || Array(numSteps).fill(false);

      const newGrid = [...patternGrid];
      newGrid[stepIndex] = !newGrid[stepIndex];

      return {
        ...prev,
        [instrumentName]: {
          ...instrument,
          grids: {
            ...grids,
            [selectedPatternID]: newGrid
          }
        }
      };
    });
  }, [selectedPatternID, numSteps, setInstrumentList]);

  const handleStop = useCallback(() => {
    console.log("Stopped !");
    Tone.Transport.stop();
    Tone.Transport.cancel();
    sequencesRef.current.forEach(seq => seq.dispose());
    sequencesRef.current = [];
  }, []);
    
  return (
    <div className="flex flex-col gap-1 flex-wrap absolute top-12.5 border-4 border-gray-700 right-0 h-[550px] max-w-[650px] max-h-[700px] overflow-y-auto p-2 space-y-2 text-white" style={{backgroundColor: colorsComponent.Background}}>
      <div className="text-xs border-b border-gray-600 pb-2" style={{color: colorsComponent.Text}}>
        Current Pattern: {selectedPatternID + 1} | Channels count: {Object.keys(instrumentList).length} | Steps: {numSteps}
        <div className="flex absolute top-0 right-0">
           <button onClick={() => setIsPlaying(!isPlaying)} className="text-sm  border border-gray-600 p-1 ml-2" style={{color: colorsComponent.Text}}>
             {isPlaying ? 'Pause' : 'Play'} Pattern
           </button>     
        </div>
      </div>
      
      {Object.entries(instrumentList).map(([instrumentName, instrumentData]) => {
        const currentGrid = instrumentData.grids?.[selectedPatternID] || Array(numSteps).fill(false);
        
        return (
          <div key={instrumentName} className="grid grid-cols-[auto_auto_80px_1fr] items-center gap-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-xs">
                {instrumentData.sampler 
                  ? <span className="text-green-400">
                      {instrumentData.fileName || "loaded"}
                    </span>
                  : <span style={{color: colorsComponent.Text}}>no sample</span>
                }
              </div>
              <input 
                type="file" 
                accept="audio/*" 
                title="Load sample"  
                className="w-16 h-6 flex-shrink-0 text-xs cursor-pointer"
                style={{color: colorsComponent.Background}}  
                onChange={(e) => handleLoadSample(instrumentName, e)} 
              />
            </div>
            
            <input 
              type="checkbox" 
              checked={instrumentData.checked || false} 
              onChange={(e) => toggleInstrumentCheck(instrumentName, e.target.checked)} 
              className="w-4 h-4 flex-shrink-0"
            />

            <div className="font-semibold text-white">{instrumentName}</div>

            <div className="flex gap-1 relative">
              {currentGrid.map((active, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(instrumentName, i)}
                  className={`w-6 h-6 rounded ${
                    active ? "bg-green-500" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="pt-2 flex gap-4">
        <button 
          onClick={() => setInput(!input)}
          className=" hover:text-white transition-colors"
          style={{color: colorsComponent.Text}}
          title="Add instrument"
        >
          <IoAddOutline size={icon_size}/>
        </button>

        <button 
          onClick={handleDeleteInstrument}
          className=" hover:text-red-300 transition-colors"
          style={{color: colorsComponent.Text}}
          title="Delete selected instruments"
        >
          <MdDeleteOutline size={icon_size}/>
        </button>

        <button
          onClick={handleReset}
          className=" hover:text-white transition-colors"
          style={{color: colorsComponent.Text}}
          title="Clear steps for current pattern"
        >
          <GrClearOption size={icon_size}/>
        </button>
      </div>
      
      <input 
        type="number" 
        value={numSteps} 
        min={4} 
        max={128} 
        className="w-20 px-2 py-1 `bg-[${colorProvider.Background}]` `text-[${colorComponent.Text}]` rounded border border-gray-600 focus:border-blue-500 outline-none" 
        onChange={(e) => setNumSteps(Number(e.target.value))} 
      />
    

      {input && (
        <div className="mt-2">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Channel name" 
              value={instrumentName} 
              onChange={(e) => setInstrumentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddInstrument(e);
                }
              }}
              className="px-2 py-1 `bg-[${colorProvider.Background}]` `text-[${colorComponent.Text}]` rounded border border-gray-600 focus:border-blue-500 outline-none"
              autoFocus
            />
            <button 
              onClick={handleAddInstrument}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Confirm
            </button>
            <button 
              onClick={() => {
                setInput(false);
                setInstrumentName("");
              }}
              className="px-3 py-1 `bg-[${colorProvider.Background}]` `text-[${colorComponent.Text}]` hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

DrumRack.displayName = 'DrumRack';

export default DrumRack;