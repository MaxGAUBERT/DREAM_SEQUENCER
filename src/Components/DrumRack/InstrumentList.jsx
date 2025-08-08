import React from "react";
import { FiUpload } from "react-icons/fi";

const STEP_SIZE = 24; // px de largeur/hauteur par step

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
    <div className="flex flex-col overflow-auto">
      {Object.entries(instrumentList).map(([name, data]) => {
        let currentGrid = data.grids?.[selectedPatternID] || [];

        // Ajuster la taille du grid au nombre de steps
        if (currentGrid.length !== numSteps) {
          currentGrid = [...currentGrid];
          if (currentGrid.length < numSteps) {
            currentGrid.push(...Array(numSteps - currentGrid.length).fill(false));
          } else {
            currentGrid = currentGrid.slice(0, numSteps);
          }
        }

        return (
          <div key={name} className="flex items-center border-b border-gray-600">
            <div className="flex items-center gap-3 w-64 min-w-64 p-2 bg-gray-800">
              <input
                type="file"
                id={`file-${name}`}
                accept="audio/*"
                hidden
                onChange={(e) => onSampleLoad(name, e)}
              />
              <button
                onClick={() => document.getElementById(`file-${name}`).click()}
                title="Load sample"
              >
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

              <button
                onClick={() => {
                  setChannelModalOpen(true);
                  setInstrumentName(name);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (e.button === 2) onDeleteInstrument(name);
                }}
                className="font-semibold hover:text-white text-gray-300"
              >
                {name}
              </button>
            </div>

            <div
              className="flex gap-1 p-2"
              style={{
                minHeight: STEP_SIZE,
                maxWidth: "calc(100vw - 300px)"
              }}
            >
              {currentGrid.map((active, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(name, i)}
                  style={{
                    width: STEP_SIZE,
                    height: STEP_SIZE
                  }}
                  className={`rounded ${active ? "bg-green-500" : "bg-gray-700"}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(InstrumentList);

