// DrumRack.jsx (composant principal allégé)
import React, { useState, useEffect } from "react";
import { useGlobalColorContext } from "../../Contexts/GlobalColorContext";
import useDrumRackHandlers from "../../Hooks/useDrumRackHandlers";
import InstrumentList from "../DrumRack/InstrumentList";
import DrumRackControls from "../DrumRack/DrumRackControls";
import InstrumentInput from "../DrumRack/InstrumentInput";
import ChannelModal from "../../UI/Modals/ChannelModal";
import { usePlayContext } from "../../Contexts/PlayContext";
import * as Tone from "tone";
import {useSynth} from "../../Hooks/useSynth";
import PatternSelector from "../PatternSelector/PatternSelector";

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
  onOpenPianoRoll
}) => {
  const [input, setInput] = useState(false);
  const { colorsComponent } = useGlobalColorContext();
  const handlers = useDrumRackHandlers({
    instrumentName,
    setInstrumentName,
    setInstrumentList,
    instrumentList,
    numSteps,
    selectedPatternID
  });
  const {state} = useSynth();
  const {isPlaying, playMode, bpm, sequencesRef} = usePlayContext();

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
      state.synthType = "";
    };

    cleanup();

    // Si pas de lecture demandée, on s'arrête là
    if (!isPlaying || playMode !== 'Pattern' || !instrumentList) {
      return;
    }
    
    let hasValidSequences = false;

    Object.entries(instrumentList).forEach(([instrumentName, instrumentData]) => {
  const rawPattern = instrumentData.grids?.[selectedPatternID];
  const sampler = instrumentData.sampler;

  if (!Array.isArray(rawPattern)) return;
  if (instrumentData.muted || playMode !== 'Pattern') return;

  const pattern = padPattern(rawPattern, numSteps);
  const hasActiveSteps = pattern.some(step => step === true);
  if (!hasActiveSteps) return;

  try {
    const seq = new Tone.Sequence((time, stepIndex) => {
      if (pattern[stepIndex]) {
        if (sampler && sampler.loaded !== false) {
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
    <div className="absolute top-[50px] right-0 border-2 overflow-auto resize-y flex flex-col w-full sm:w-[400px] md:w-[500px] lg:w-[600px] max-h-[80vh] shadow-lg" 
      style={{ backgroundColor: colorsComponent.Background, color: colorsComponent.Text, borderColor: colorsComponent.Border }}>

      <div className="text-xs border-b p-2 pb-2">
        Current Pattern: {patterns.find(p => p.id === selectedPatternID)?.name} | Channels count: {Object.keys(instrumentList).length} | Steps: {numSteps}
      </div>

      <InstrumentList
        instrumentList={instrumentList}
        selectedPatternID={selectedPatternID}
        numSteps={numSteps}
        setChannelModalOpen={setChannelModalOpen}
        setInstrumentName={setInstrumentName}
        toggleStep={handlers.toggleStep}
        onMute={handlers.onMute}
        onSlotChange={handlers.onSlotChange}
        onSampleLoad={handlers.onSampleLoad}
        onDeleteInstrument={handlers.onDeleteInstrument}
      />

      <DrumRackControls
        numSteps={numSteps}
        setNumSteps={setNumSteps}
        onReset={handlers.onReset}
        onDeleteAll={handlers.onDeleteAll}
        onAddToggle={() => setInput(!input)}
      />

      {input && (
        <InstrumentInput
          instrumentName={instrumentName}
          setInstrumentName={setInstrumentName}
          onConfirm={handlers.onAddInstrument}
          onAddSynth={handlers.onAddSynth}
          onCancel={() => {
            setInput(false);
            setInstrumentName('');
          }}
        />
      )}

      {channelModalOpen && (
        <div className="inset-0 z-50 fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center bg-opacity-50">
          <ChannelModal
            onClose={() => setChannelModalOpen(false)}
            instrumentList={instrumentList}
            setInstrumentList={setInstrumentList}
            instrumentName={instrumentName}
            setInstrumentName={setInstrumentName}
            onRename={handlers.onRename}
            onSelectSample={handlers.onSelectSample}
            channelUrl={instrumentList[instrumentName]?.sampleUrl}
            onOpenPianoRoll={onOpenPianoRoll}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(DrumRack);