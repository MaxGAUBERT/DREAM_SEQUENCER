import React, { useCallback } from "react";
import { useDrumRackStore } from "../../store/useDrumRackStore";
import InstrumentRow from "./InstrumentRow";

const InstrumentList = ({
  instrumentList,
  selectedPatternID,
  numSteps,
  onOpenChannelModal,
  onOpenPianoRoll,
  onSelectSample,
}) => {
  const { toggleStep, muteInstrument, setSlot, deleteInstrument } = useDrumRackStore();

  const handleToggle = useCallback((name, patternID, idx) => {toggleStep(name, patternID, idx);}, [toggleStep]
);
  const handleMute      = useCallback((name, v)   => muteInstrument(name, v), []);
  const handleSlot      = useCallback((name, v)   => setSlot(name, v), []);
  const handleDelete    = useCallback((name)       => deleteInstrument(name), []);
  const handleSample    = useCallback((name, url, display) => onSelectSample(name, url, display), [onSelectSample]);
  const handleModal     = useCallback((name)       => onOpenChannelModal(name), [onOpenChannelModal]);
  const handlePianoRoll = useCallback((name)       => onOpenPianoRoll(name), [onOpenPianoRoll]);

  return (
    <div className="flex flex-col">
      {Object.entries(instrumentList).map(([name, data]) => (
        <InstrumentRow
          key={name}
          name={name}
          data={data}
          selectedPatternID={selectedPatternID}
          numSteps={numSteps}
          onToggleStep={handleToggle}
          onMute={handleMute}
          onSlot={handleSlot}
          onDelete={handleDelete}
          onSelectSample={handleSample}
          onOpenModal={handleModal}
          onOpenPianoRoll={handlePianoRoll}
        />
      ))}
    </div>
  );
};

export default React.memo(InstrumentList);