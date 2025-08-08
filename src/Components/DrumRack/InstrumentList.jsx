import React from "react";
import { FiUpload } from "react-icons/fi";

const InstrumentList = ({
  instrumentList,
  selectedPatternID,
  numSteps,
  setChannelModalOpen,
  setInstrumentName,
  toggleStep,
  onMute,
  onSlotChange,
  onSampleLoad,
  onDeleteInstrument
}) => {
  return (
    <>
      {Object.entries(instrumentList).map(([name, data]) => {
        let currentGrid = data.grids?.[selectedPatternID] || [];

        if (currentGrid.length !== numSteps) {
          currentGrid = [...currentGrid]; 
          if (currentGrid.length < numSteps) {
            currentGrid.push(...Array(numSteps - currentGrid.length).fill(false));
          } else {
            currentGrid = currentGrid.slice(0, numSteps);
          }
        }

        return (
          <div key={name} className="grid grid-cols-[auto_auto_80px_1fr] items-center gap-x-4">
            <div className="flex items-center space-x-5">
              <input
                type="file"
                id={`file-${name}`}
                accept="audio/*"
                hidden
                onChange={(e) => onSampleLoad(name, e)}
              />
              <button onClick={() => document.getElementById(`file-${name}`).click()} title="Load sample">
                <FiUpload size={16} />
              </button>

              <input
                type="checkbox"
                checked={data.muted}
                onChange={(e) => onMute(name, e.target.checked)}
              />
              
              <input
                type="number"
                min={0}
                max={200}
                step={1}
                value={data.slot || 0}
                onChange={(e) => onSlotChange(name, Number(e.target.value))}
                className="w-10 h-6"
              />
            </div>

            <div className="font-semibold absolute left-35 text-gray-700">
              <button
                onClick={() => {
                  setChannelModalOpen(true);
                  setInstrumentName(name);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (e.button === 2) onDeleteInstrument(name);
                }}
                className="hover:text-white"
              >
                {name}
              </button>
            </div>

            <div className="flex gap-1 ml-60 absolute" key={`grid-${name}-${numSteps}`}>
              {currentGrid.map((active, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(name, i)}
                  className={`w-6 h-6 rounded ${active ? "bg-green-500" : "bg-gray-700"}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default React.memo(InstrumentList);
