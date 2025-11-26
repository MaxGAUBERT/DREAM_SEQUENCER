// DrumRack.jsx (composant principal utilisant le système d'historique global)
import React, { useState, useEffect } from "react";
import { useGlobalColorContext } from "../../Contexts/GlobalColorContext";
import useDrumRackHandlers from "../../Hooks/useDrumRackHandlers";
import InstrumentList from "../DrumRack/InstrumentList";
import DrumRackControls from "../DrumRack/DrumRackControls";
import InstrumentInput from "../DrumRack/InstrumentInput";
import ChannelModal from "../../UI/Modals/ChannelModal";
import { usePlayContext } from "../../Contexts/PlayContext";
import * as Tone from "tone";
import {useSampleContext} from "../../Contexts/ChannelProvider";
import { LiaVolumeMuteSolid } from "react-icons/lia";
import { RxMixerVertical } from "react-icons/rx";
import { FaListOl } from "react-icons/fa";


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
  
  const {
    toggleStep,
    onMute,
    onSlotChange,
    onSampleLoad,
    onDeleteInstrument,
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
  const {getSampler} = useSampleContext();

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
      const sampler = getSampler(instrumentName);

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
    <div className="absolute top-[50px] right-0 border-2 overflow-hidden resize-y flex flex-col w-full sm:w-[400px] md:w-[500px] lg:w-[600px] max-h-[80vh] shadow-lg scrollbar-custom" 
      style={{ backgroundColor: colorsComponent.Background, color: colorsComponent.Text, borderColor: colorsComponent.Border }}>

      <div className="text-xs border-b p-2 pb-2 flex justify-between items-center">
        <div>
          Current Pattern: {patterns.find(p => p.id === selectedPatternID)?.name} | Channels count: {Object.keys(instrumentList).length} | Steps: {numSteps}
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-2 left-16.5 relative">
          <LiaVolumeMuteSolid size={20} />
          <RxMixerVertical size={20} />
          <FaListOl size={20} className="relative left-11" />
      </div>
      
      <InstrumentList
        instrumentList={instrumentList}
        selectedPatternID={selectedPatternID}
        numSteps={numSteps}
        setChannelModalOpen={setChannelModalOpen}
        setInstrumentName={setInstrumentName}
        toggleStep={toggleStep}
        onMute={onMute}
        onSlotChange={onSlotChange}
        onSampleLoad={onSampleLoad}
        onDeleteInstrument={onDeleteInstrument}
      />

      <DrumRackControls
        numSteps={numSteps}
        setNumSteps={setNumSteps}
        onReset={onReset}
        onDeleteAll={onDeleteAll}
        onAddToggle={() => setInput(!input)}
      />

      {input && (
        <InstrumentInput
          instrumentName={instrumentName}
          setInstrumentName={setInstrumentName}
          onConfirm={onAddInstrument}
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