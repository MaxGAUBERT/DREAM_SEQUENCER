// DrumRack.jsx (composant principal utilisant le système d'historique global)
import * as Tone from "tone";
import React, { useState, useEffect } from "react";
import { useGlobalColorContext } from "../../Contexts/GlobalColorContext";
import useDrumRackHandlers from "../../Hooks/DrumRack/useDrumRackHandlers";
import InstrumentList from "../DrumRack/InstrumentList";
import DrumRackControls from "../DrumRack/DrumRackControls";
import InstrumentInput from "../DrumRack/InstrumentInput";
import ChannelModal from "../../UI/Modals/ChannelModal";
import { usePlayContext } from "../../Contexts/PlayContext";
import {useSampleContext} from "../../Contexts/ChannelProvider";
import { IoClose } from "react-icons/io5";
import MiniBrowser from "./MiniBrowser";
import usePatternManager from "../../Hooks/Patterns/usePatternManager";

const DrumRack = ({
  numSteps,
  setNumSteps,
  patterns,
  instrumentList,
  setInstrumentList,
  selectedPatternID,
  channelModalOpen,
  setChannelModalOpen,
  instrumentName,
  setInstrumentName,
  onOpenPianoRoll, 
  onClose, 
}) => {
  const [input, setInput] = useState(false);
  const { colorsComponent } = useGlobalColorContext();
  
  const {
    toggleStep,
    onMute,
    onSlotChange,
    onSampleLoad,
    onDeleteInstrument,
    onClear,
    onReset,
    onDeleteAll,
    onRename,
    onAddInstrument,
    onSelectSample
  } = useDrumRackHandlers({
    instrumentName,
    setInstrumentName,
    setInstrumentList,
    instrumentList,
    numSteps,
    selectedPatternID
  });

  const {isPlaying, playMode, bpm, sequencesRef} = usePlayContext();
  const {getSampler, loadSample} = useSampleContext();

  function padPattern(pattern, numSteps) {
    const padded = [...pattern];
    while (padded.length < numSteps) {
      padded.push(false);
    }
    return padded;
  }

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
    if (!isPlaying || playMode !== 'Pattern' || !instrumentList) {
      return;
    }
    
    let hasValidSequences = false;

    Object.entries(instrumentList).forEach(([instrumentName, instrumentData]) => {
      const rawPattern = instrumentData.grids?.[selectedPatternID];

      let sampler = getSampler(instrumentName);

      // Si aucun sampler n'existe encore, DrumRack demande au ChannelProvider de le charger
      if (!sampler) {
        const url = instrumentData.sampleUrl;
        if (!url) return; // pas de sample → canal muet

        console.log(`↻ DrumRack loading sampler for ${instrumentName}: ${url}`);

        loadSample(instrumentName, url);
        return; // attendre le prochain passage du useEffect
      }



      if (!Array.isArray(rawPattern)) return;
      if (instrumentData.muted || playMode !== "Pattern") return;

      const pattern = padPattern(rawPattern, numSteps);
      const hasActiveSteps = pattern.some(step => step === true);
      if (!hasActiveSteps) return;

      try {
        const seq = new Tone.Sequence((time, stepIndex) => {
          if (pattern[stepIndex]) {
            if (sampler.loaded !== false) {
              sampler.triggerAttackRelease("C4", "4n", time);
            }
          }
        }, Array.from({ length: numSteps }, (_, i) => i), "16n");

        seq.start(0);
        sequencesRef.current.push(seq);
        hasValidSequences = true;
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
  }, [isPlaying, bpm, playMode, numSteps, instrumentList, selectedPatternID]);


  return (
    <div
  className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden rounded-xl ring-1 ring-white/15 bg-gray-900"
  style={{ backgroundColor: colorsComponent.Background, color: colorsComponent.Text }}
>
  {/* Top bar */}
  <div className="sticky top-0 z-10 flex items-center justify-between bg-gray-800/80 backdrop-blur px-3 py-2">
    <div className="text-xs">
      Current Pattern: {patterns.find(p => p.id === selectedPatternID)?.name} |
      Channels: {Object.keys(instrumentList).length} | Steps: {numSteps}
    </div>
    <button
      className="px-2 py-1 rounded hover:bg-gray-700 transition-colors"
      onClick={onClose}
      title="Close Drum Rack"
    >
      <IoClose size={15} />
    </button>
  </div>

  {/* Zone scrollable */}
  <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom px-2 py-2">
    <InstrumentList
      {...{ instrumentList, selectedPatternID, numSteps, setChannelModalOpen,
            setInstrumentName, toggleStep, onMute, onSlotChange, onSampleLoad,
            onDeleteInstrument, onSelectSample, onOpenPianoRoll }}
    />

    <div className="mt-3">
      <DrumRackControls
        numSteps={numSteps}
        setNumSteps={setNumSteps}
        onClear={onClear}
        onReset={onReset}
        onDeleteAll={onDeleteAll}
        onAddToggle={() => setInput(v => !v)}
      />
    </div>

    <div className="mt-3">
      <MiniBrowser />
    </div>

    {input && (
      <div className="mt-3">
        <InstrumentInput
          instrumentName={instrumentName}
          setInstrumentName={setInstrumentName}
          onConfirm={onAddInstrument}
          onCancel={() => { setInput(false); setInstrumentName(''); }}
        />
      </div>
    )}
  </div>

  {/* Modal centré avec backdrop correct */}
  {channelModalOpen && (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <ChannelModal
        onClose={() => setChannelModalOpen(false)}
        instrumentList={instrumentList}
        setInstrumentList={setInstrumentList}
        instrumentName={instrumentName}
        setInstrumentName={setInstrumentName}
        onRename={onRename}
        onSelectSample={onSelectSample}
        channelUrl={instrumentList[instrumentName]?.sampleUrl}
        onOpenPianoRoll={onOpenPianoRoll}
      />
    </div>
  )}
</div>

  );
};

export default React.memo(DrumRack);