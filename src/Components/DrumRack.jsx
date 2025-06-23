import React, { useState, useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";
import { usePlayContext } from "../Contexts/PlayContext";
import { IoAddOutline } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import { GrClearOption } from "react-icons/gr";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext"; // adapte le chemin
import ChannelModal from "../UI/Modals/ChannelModal";
import { useProjectManager } from "../Hooks/useProjectManager";

const icon_size = 20;

const DrumRack = React.memo(({numSteps, setNumSteps, instrumentList, setInstrumentList, selectedPatternID, channelModalOpen, setChannelModalOpen, instrumentName, setInstrumentName, onOpenPianoRoll}) => {
  const [input, setInput] = useState(false);
  const { sequencesRef, isPlaying, setIsPlaying, bpm, metronome, metronomeSampler, playMode, setPlayMode} = usePlayContext();
  const { colorsComponent} = useGlobalColorContext();
  const {assignSampleToInstrument} = useProjectManager();



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

  useEffect(() => {
  if (metronome && metronomeSampler && metronomeSampler.loaded) {
    const metroLoop = new Tone.Loop((time) => {
      metronomeSampler.triggerAttackRelease("C4", "8n", time);
    }, "4n"); // "4n" = chaque temps (1 battement)

    metroLoop.start(0); // commence dès le début
    Tone.Transport.start();

    return () => {
      metroLoop.dispose(); // nettoyer à l'arrêt ou démontage
    };
  }
  }, [metronome, metronomeSampler]);

  useEffect(() => {
    Object.entries(instrumentList).forEach(([instrumentName, instrumentData]) => {
      const sampleData = instrumentData.sample;
      
      if (sampleData && sampleData.urls?.C4 && !instrumentData.sampler) {
        const sampler = new Tone.Sampler({
          urls: { C4: sampleData.urls.C4 },
          release: 1,
          onload: () => {
            console.log(`Sample restauré pour ${instrumentName}: ${sampleData.name}`);
          },
          onerror: (error) => {
            console.error(`Erreur lors de la restauration du sample pour ${instrumentName}:`, error);
          }
        }).toDestination();

        setInstrumentList(prev => ({
          ...prev,
          [instrumentName]: {
            ...prev[instrumentName],
            sampler,
            sampleUrl: sampleData.urls.C4,
            fileName: sampleData.name
          }
        }));
      }

    });
  }, [instrumentList, setInstrumentList]);
  
  const handleDeleteInstrument = useCallback((instrumentName) => {
    setInstrumentList(prev => {
      const newList = { ...prev };
      delete newList[instrumentName];
      return newList;
    });
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

  if (!file.type.startsWith('audio/')) {
    console.error('Please select an audio file');
    return;
  }

  const cleanName = file.name.replace(/\.[^/.]+$/, ""); // sans extension
  const truncatedName = cleanName.length > 20 ? cleanName.slice(0, 20) + "..." : cleanName;

  setInstrumentList(prev => {
    const oldData = prev[instrument];
    if (oldData?.sampleUrl) {
      URL.revokeObjectURL(oldData.sampleUrl);
    }

    const newUrl = URL.createObjectURL(file);

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
        sample: {
        ...prev[instrument].sample,
        urls: { C4: newUrl },
        name: truncatedName
      }

      }
    };

  });

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
    if (!isPlaying || playMode !== 'Pattern') {
      return;
    }
    
    // Configuration du BPM
    Tone.Transport.bpm.value = bpm;
    
    let hasValidSequences = false;

    Object.entries(instrumentList).forEach(([instrumentName, instrumentData]) => {
      const pattern = instrumentData.grids?.[selectedPatternID];
      const sampler = instrumentData.sampler;

      console.log(`Checking ${instrumentName}:`, {
        hasPattern: !!pattern,
        hasSampler: !!sampler,
        samplerLoaded: sampler?.loaded,
        patternLength: pattern?.length,
        pattern: pattern
      });

      // Vérifications de base
      if (!pattern || !Array.isArray(pattern)) {
        console.log(`Skip ${instrumentName}: no valid pattern`);
        return;
      }

      if (!sampler) {
        console.log(`Skip ${instrumentName}: no sampler`);
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
            // Vérifier que le sampler est valide avant de jouer
            if (sampler && (sampler.loaded !== false)) {
              try {
                sampler.triggerAttackRelease("C4", "8n", time);
              } catch (playError) {
                console.error(`Error playing sample for ${instrumentName}:`, playError);
              }
            }
          }
        }, Array.from({ length: pattern.length }, (_, i) => i), "16n");

        seq.start(0);
        sequencesRef.current.push(seq);
        hasValidSequences = true;
        console.log(`✓ Sequence created for ${instrumentName} with ${pattern.filter(s => s).length} active steps`);
      } catch (error) {
        console.error(`Error creating sequence for ${instrumentName}:`, error);
      }
    });

    // Démarrer le transport seulement s'il y a des séquences valides
    if (hasValidSequences) {
      try {
        Tone.Transport.start();
        console.log(`✓ Transport started for pattern ${selectedPatternID + 1} with ${sequencesRef.current.length} sequences`);
      } catch (error) {
        console.error('Error starting transport:', error);
      }
    } else {
      console.log(`⚠ No valid sequences to play for pattern ${selectedPatternID + 1}`);
      console.log('Debug info:', {
        totalInstruments: Object.keys(instrumentList).length,
        selectedPattern: selectedPatternID,
        isPlaying,
        playMode
      });
    }

    // Cleanup au démontage
    return cleanup;
  }, [instrumentList, selectedPatternID, isPlaying, bpm, playMode]);

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

  const handleRenameInstrument = useCallback((newName) => {
  const trimmedName = newName.trim();
  
  if (!trimmedName) return;
  if (trimmedName === instrumentName) return;
  if (instrumentList[trimmedName]) {
    alert('Un instrument avec ce nom existe déjà');
    return;
  }
  
  setInstrumentList(prev => {
    // Convertir en array, modifier, puis reconvertir en objet
    const entries = Object.entries(prev).map(([key, value]) => {
      return key === instrumentName ? [trimmedName, value] : [key, value];
    });
    
    return Object.fromEntries(entries);
  });
  
  setInstrumentName(trimmedName);
}, [instrumentName, instrumentList, setInstrumentName]);


  // CORRECTION : Fonction handleSelectSample corrigée
  const handleSelectSample = useCallback(async (sample, targetInstrument) => {
    const targetInst = targetInstrument;
    if (!targetInst || !sample) return;

    console.log('Assigning sample:', sample, 'to instrument:', targetInst);

    try {
      // Récupérer l'URL du sample
      const sampleUrl = sample.url;
      
      setInstrumentList(prev => {
        const updated = { ...prev };
        if (!updated[targetInst]) return prev;

        // Disposer de l'ancien sampler s'il existe
        const oldSampler = updated[targetInst].sampler;
        if (oldSampler) {
          oldSampler.dispose();
        }

        // Nettoyer l'ancienne URL si elle existe
        const oldUrl = updated[targetInst].sampleUrl;
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }

        // Créer le nouveau sampler avec l'URL directe
        const sampler = new Tone.Sampler({
          urls: { C4: sampleUrl },
          release: 1,
          onload: () => {
            console.log(`✓ Sample loaded successfully: ${sample.name} -> ${targetInst}`);
          },
          onerror: (error) => {
            console.error(`✗ Error loading sample for ${targetInst}:`, error);
          }
        }).toDestination();
        
        const sampleData = {
          id: sample.id,
          urls: { C4: sampleUrl },
          name: sample.name
        };

        // Utiliser la fonction du ProjectManager pour sauvegarder
        assignSampleToInstrument(targetInst, sampleData);

        const updatedInstrument = {
          ...prev[targetInst],
          sampler,
          sample: sampleData,
          sampleUrl: sampleUrl,
          fileName: sample.name
        };

        console.log(`✓ Instrument ${targetInst} updated with sample:`, updatedInstrument);

        return {
          ...prev,
          [targetInst]: updatedInstrument
        };
      });
    } catch (error) {
      console.error('Erreur lors de l\'attribution du sample:', error);
    }
    console.log("Instrument updated:", instrumentList[instrumentName]);
  }, [instrumentName, setInstrumentList, assignSampleToInstrument]);
  

  return (
    <div className="absolute top-[50px] right-0 border-2 overflow-auto resize-y flex flex-col w-full sm:w-[400px] md:w-[500px] lg:w-[600px] max-h-[80vh]      
  shadow-lg
" style={{backgroundColor: colorsComponent.Background, color: colorsComponent.Text, borderColor: colorsComponent.Border}}>
      <div className="text-xs border-b p-2 pb-2">
        Current Pattern: {selectedPatternID + 1} | Channels count: {Object.keys(instrumentList).length} | Steps: {numSteps}
      </div>
      
      {Object.entries(instrumentList).map(([instrumentName, instrumentData]) => {
        const currentGrid = instrumentData.grids?.[selectedPatternID] || Array(numSteps).fill(false);
        
        return (
          <div key={instrumentName} className="grid grid-cols-[auto_auto_80px_1fr] items-center gap-x-4">
            <div className="flex items-center space-x-2">
              <input 
                type="file" 
                accept="audio/*" 
                title="Load sample"
                className="w-16 h-6 flex-shrink-0 text-xs cursor-pointer"
                style={{color: colorsComponent.Background}}  
                onChange={(e) => handleLoadSample(instrumentName, e)} 
                {...instrumentData.sampler ? {disabled: true, hidden: false} : {}}
              />
               
            </div>
      
            <div className="font-semibold text-gray-700 rounded">
              <button 
                onClick={() => {setChannelModalOpen(!channelModalOpen); setInstrumentName(instrumentName)}}
                className="hover:text-white transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (e.button === 2) {
                    handleDeleteInstrument(instrumentName);
                  }
                }}
              >
                {instrumentName}
              </button>
              
            </div>
            <div className="flex flex-row gap-1 ml-40 absolute">
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

      <div className="flex gap-1 ml-2">
        <button 
          onClick={() => setInput(!input)}
          className=" hover:text-white transition-colors"
          title="Add channel"
        >
          <IoAddOutline size={icon_size}/>
        </button>

        <button 
          onClick={handleDeleteInstrument}
          className=" hover:text-red-300 transition-colors"
          style={{backgroundColor: colorsComponent.Background, color: colorsComponent.Text}}
          title="Delete all channels"
        >
          <MdDeleteOutline size={icon_size}/>
        </button>

        <button
          onClick={handleReset}
          className=" hover:text-white transition-colors"
          style={{backgroundColor: colorsComponent.Background, color: colorsComponent.Text}}
          title="Clear steps for current pattern"
        >
          <GrClearOption size={icon_size}/>
        </button>
      </div>
      
      <input 
        type="range" 
        value={numSteps} 
        min={8} 
        max={256} 
        step={1}
        title="Steps number"
        className="w-60 px-2 py-1 `bg-[${colorComponent.Background}]` `text-[${colorComponent.Text}]` rounded border focus:border-blue-500 outline-none" 
        onChange={(e) => {
          if (e.target.value < 8 || e.target.value > 256) {
            return;
          }
          setNumSteps(Number(e.target.value))
        }} 
      />
      
      {input && (
        <div>
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
              className="px-2 py-1 rounded border focus:border-blue-500 outline-none"
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
                setInstrumentName('');
              }}
              className="px-3 py-1 hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {channelModalOpen && (
        <div className="inset-0 z-50 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center bg-opacity-50">
          <ChannelModal 
            onClose={() => setChannelModalOpen(!channelModalOpen)} 
            instrumentName={instrumentName}
            setInstrumentName={setInstrumentName}
            onRename={handleRenameInstrument} 
            onSelectSample={handleSelectSample}
            channelUrl={instrumentList[instrumentName]?.sampleUrl}
            onOpenPianoRoll={onOpenPianoRoll}
          />
        </div>
      )}
    </div>

    
  );
});

DrumRack.displayName = 'DrumRack';

export default DrumRack;