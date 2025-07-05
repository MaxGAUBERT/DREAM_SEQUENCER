import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import * as Tone from "tone";
import { usePlayContext } from "../Contexts/PlayContext";
import { IoAddOutline } from "react-icons/io5";
import { FiUpload } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import { GrClearOption } from "react-icons/gr";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";
import ChannelModal from "../UI/Modals/ChannelModal";
import { useProjectManager } from "../Hooks/useProjectManager";

const icon_size = 20;

// Composant optimisé pour les boutons de step
const StepButton = React.memo(({ active, onClick, stepIndex }) => (
  <button
    onClick={onClick}
    className={`w-6 h-6 rounded ${
      active ? "bg-green-500" : "bg-gray-700"
    }`}
  />
));

// Composant optimisé pour chaque instrument
const InstrumentRow = React.memo(({ 
  instrumentName, 
  instrumentData, 
  numSteps, 
  selectedPatternID, 
  colorsComponent,
  onToggleStep,
  onLoadSample,
  onToggleMute,
  onSlotChange,
  onOpenChannel,
  onDeleteInstrument 
}) => {
  const currentGrid = useMemo(() => 
    instrumentData.grids?.[selectedPatternID] || Array(numSteps).fill(false),
    [instrumentData.grids, selectedPatternID, numSteps]
  );

  const handleToggleStep = useCallback((stepIndex) => {
    onToggleStep(instrumentName, stepIndex);
  }, [instrumentName, onToggleStep]);

  const handleLoadSample = useCallback((e) => {
    onLoadSample(instrumentName, e);
  }, [instrumentName, onLoadSample]);

  const handleToggleMute = useCallback((e) => {
    onToggleMute(instrumentName, e.target.checked);
  }, [instrumentName, onToggleMute]);

  const handleSlotChange = useCallback((e) => {
    onSlotChange(instrumentName, Number(e.target.value));
  }, [instrumentName, onSlotChange]);

  const handleOpenChannel = useCallback(() => {
    onOpenChannel(instrumentName);
  }, [instrumentName, onOpenChannel]);

  const handleDeleteInstrument = useCallback((e) => {
    e.preventDefault();
    if (e.button === 2) {
      onDeleteInstrument(instrumentName);
    }
  }, [instrumentName, onDeleteInstrument]);

  return (
    <div className="grid grid-cols-[auto_auto_80px_1fr] items-center gap-x-4">
      <div className="flex items-center space-x-5">
        <input 
          type="file" 
          id={`file-${instrumentName}`}
          accept="audio/*" 
          title="Load sample"
          className="w-10 h-6 flex-shrink-0 text-xs cursor-pointer"
          style={{color: colorsComponent.Background}}  
          onChange={handleLoadSample} 
          hidden
        />
        <button onClick={() => document.getElementById(`file-${instrumentName}`).click()} title="Load sample">
          <FiUpload size={16} />
        </button>

        <input 
          type="checkbox"
          checked={instrumentData.muted}
          onChange={handleToggleMute}
          className="w-3 h-3 flex-shrink-10 cursor-pointer"
        />
        <input
          title="FX Slot"
          type="number"
          min={0}
          max={200}
          value={instrumentData.slot || 0}
          step={1}
          onChange={handleSlotChange}
          className="w-10 h-6 mr-5 flex-shrink-0"
          style={{color: colorsComponent.Background, backgroundColor: "red"}}  
        />
      </div>

      <div className="font-semibold absolute left-35 text-gray-700 rounded">
        <button 
          onClick={handleOpenChannel}
          className="hover:text-white transition-colors"
          onMouseDown={handleDeleteInstrument}
        >
          {instrumentName}
        </button>
      </div>

      <div className="flex flex-row gap-1 ml-60 absolute">
        {currentGrid.map((active, i) => (
          <StepButton
            key={i}
            active={active}
            onClick={() => handleToggleStep(i)}
            stepIndex={i}
          />
        ))}
      </div>
    </div>
  );
});

const DrumRack = React.memo(({
  numSteps, 
  setNumSteps, 
  instrumentList, 
  setInstrumentList, 
  selectedPatternID, 
  channelModalOpen, 
  setChannelModalOpen, 
  instrumentName, 
  setInstrumentName, 
  onOpenPianoRoll
}) => {
  const [input, setInput] = useState(false);
  const {sequencesRef, isPlaying, bpm, metronome, metronomeSampler, playMode} = usePlayContext();
  const { colorsComponent } = useGlobalColorContext();
  const {assignSampleToInstrument} = useProjectManager();

  // Mémoiser les entrées d'instruments pour éviter les re-renders
  const instrumentEntries = useMemo(() => 
    Object.entries(instrumentList), 
    [instrumentList]
  );

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
          /*
          const oldSampler = updated[targetInst].sampler;
          if (oldSampler) {
            oldSampler.dispose();
          }
          */
  
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
  
  // Mémoiser les callbacks pour éviter les re-créations
  const handleToggleStep = useCallback((instrumentName, stepIndex) => {
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

  const handleLoadSample = useCallback((instrument, e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('audio/')) return;

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
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
        onload: () => console.log(`Sample loaded successfully for ${instrument}`),
        onerror: (error) => console.error(`Error loading sample for ${instrument}:`, error)
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

  const handleToggleMute = useCallback((instrumentName, muted) => {
    if (!instrumentName) return;

    setInstrumentList(prev => ({
      ...prev,
      [instrumentName]: {
        ...prev[instrumentName],
        muted: muted
      }
    }));
  }, [setInstrumentList]);

  const handleSlotChange = useCallback((instrumentName, slotNumber) => {
    if (!instrumentName) return;
    
    setInstrumentList(prev => ({
      ...prev,
      [instrumentName]: {
        ...prev[instrumentName],
        slot: slotNumber
      }
    }));
  }, [setInstrumentList]);

  const handleOpenChannel = useCallback((instrumentName) => {
    setChannelModalOpen(!channelModalOpen);
    setInstrumentName(instrumentName);
  }, [channelModalOpen, setChannelModalOpen, setInstrumentName]);

  const handleDeleteInstrument = useCallback((instrumentName) => {
    setInstrumentList(prev => {
      const newList = { ...prev };
      delete newList[instrumentName];
      return newList;
    });
  }, [setInstrumentList]);

  const handleAddInstrument = useCallback((e) => {
    e?.preventDefault?.();
    if (!instrumentName.trim()) return;

    setInstrumentList(prev => {
      const newInstrument = {
        value: null,
        grids: {},
        muted: false,
        slot: 0
      };
      
      const existingPatternIds = Object.keys(prev).length > 0 
        ? Object.keys(Object.values(prev)[0].grids || {})
        : [selectedPatternID];
      
      existingPatternIds.forEach(patternId => {
        newInstrument.grids[patternId] = Array(numSteps).fill(false);
      });
      
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

  const handleReset = useCallback(() => {
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

  // Optimisation des effets avec dépendances précises
  useEffect(() => {
    if (!numSteps || numSteps < 4) return;

    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        if (!newList[inst].grids) {
          newList[inst].grids = {};
        }
        
        Object.keys(newList[inst].grids).forEach(patternId => {
          const currentGrid = newList[inst].grids[patternId] || [];
          const newGrid = Array(numSteps).fill(false);
          
          for (let i = 0; i < Math.min(currentGrid.length, numSteps); i++) {
            newGrid[i] = currentGrid[i];
          }
          
          newList[inst].grids[patternId] = newGrid;
        });
      });
      return newList;
    });
  }, [numSteps, setInstrumentList]);

  // Optimisation de l'effet de lecture
  useEffect(() => {
    const cleanup = () => {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
      }
      Tone.Transport.cancel();
      sequencesRef.current.forEach(seq => {
        if (seq.state !== 'stopped') seq.stop();
        seq.dispose();
      });
      sequencesRef.current = [];
    };

    cleanup();

    if (!isPlaying || playMode !== 'Pattern' || !instrumentList) return;
    
    let hasValidSequences = false;

    Object.entries(instrumentList).forEach(([instrumentName, instrumentData]) => {
      const pattern = instrumentData.grids?.[selectedPatternID];
      const sampler = instrumentData.sampler;

      if (!pattern || !Array.isArray(pattern) || !sampler || 
          instrumentData.muted || !pattern.some(step => step === true)) {
        return;
      }

      try {
        const seq = new Tone.Sequence((time, stepIndex) => {
          if (pattern[stepIndex] === true && sampler && sampler.loaded !== false) {
            sampler.triggerAttackRelease("C4", "8n", time);
          }
        }, Array.from({ length: pattern.length }, (_, i) => i), "16n");

        seq.start(0);
        sequencesRef.current.push(seq);
        hasValidSequences = true;
      } catch (error) {
        console.error(`Error creating sequence for ${instrumentName}:`, error);
      }
    });

    if (hasValidSequences) {
      Tone.Transport.start();
    }

    return cleanup;
  }, [isPlaying, playMode, instrumentList, selectedPatternID, sequencesRef]);

  return (
    <div className="absolute top-[50px] right-0 border-2 overflow-auto resize-y flex flex-col w-full sm:w-[400px] md:w-[500px] lg:w-[600px] max-h-[80vh] shadow-lg" 
         style={{backgroundColor: colorsComponent.Background, color: colorsComponent.Text, borderColor: colorsComponent.Border}}>
      
      <div className="text-xs border-b p-2 pb-2">
        Current Pattern: {selectedPatternID + 1} | Channels count: {Object.keys(instrumentList).length} | Steps: {numSteps}
      </div>
      
      {instrumentEntries.map(([instrumentName, instrumentData]) => (
        <InstrumentRow
          key={instrumentName}
          instrumentName={instrumentName}
          instrumentData={instrumentData}
          numSteps={numSteps}
          selectedPatternID={selectedPatternID}
          colorsComponent={colorsComponent}
          onToggleStep={handleToggleStep}
          onLoadSample={handleLoadSample}
          onToggleMute={handleToggleMute}
          onSlotChange={handleSlotChange}
          onOpenChannel={handleOpenChannel}
          onDeleteInstrument={handleDeleteInstrument}
        />
      ))}

      <div className="flex gap-1 ml-2">
        <button 
          onClick={() => setInput(!input)}
          className="hover:text-white transition-colors"
          title="Add channel"
        >
          <IoAddOutline size={icon_size}/>
        </button>

        <button 
          onClick={handleDeleteInstrument}
          className="hover:text-red-300 transition-colors"
          style={{backgroundColor: colorsComponent.Background, color: colorsComponent.Text}}
          title="Delete all channels"
        >
          <MdDeleteOutline size={icon_size}/>
        </button>

        <button
          onClick={handleReset}
          className="hover:text-white transition-colors"
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
        className="w-60 px-2 py-1 rounded border focus:border-blue-500 outline-none" 
        onChange={(e) => {
          const value = Number(e.target.value);
          if (value >= 8 && value <= 256) {
            setNumSteps(value);
          }
        }} 
      />
      
      {input && (
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
      )}

      {channelModalOpen && (
        <div className="inset-0 z-50 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center bg-opacity-50">
          <ChannelModal 
            onClose={() => setChannelModalOpen(!channelModalOpen)}
            instrumentList={instrumentList}
            setInstrumentList={setInstrumentList} 
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
StepButton.displayName = 'StepButton';
InstrumentRow.displayName = 'InstrumentRow';

export default DrumRack;