import React from "react";
import { FiUpload } from "react-icons/fi";
import { MdPiano } from "react-icons/md";

const STEP_SIZE = 24; 

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
  onDeleteInstrument,
  onSelectSample,
  onOpenPianoRoll
}) => {
  // petite aide visuelle facultative (classes utilitaires)
  const dropClasses =
    "outline outline-1 outline-transparent data-[over=true]:outline-blue-400 data-[over=true]:outline-2";

  return (
    <div className="flex flex-col">
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

        // Handlers DnD pour le header du canal
        const handleDragOver = (e) => {
          e.preventDefault();
          e.currentTarget.dataset.over = "true";
        };
        const handleDragLeave = (e) => {
          e.currentTarget.dataset.over = "false";
        };
        
        const handleDrop = (e) => {
          e.preventDefault();
          e.currentTarget.dataset.over = "false";
          const url = e.dataTransfer.getData("audio/url");
          const droppedName = e.dataTransfer.getData("audio/name"); // 👈 NOUVEAU

          if (url && typeof onSelectSample === "function") {
            onSelectSample(name, url, droppedName); // 👈 on passe le nom pour l’affichage
          }
        };

        return (
          <div key={name} className="flex items-center border-b border-gray-600">
            <div
              className={`flex items-center w-64 min-w-64 bg-gray-800 ${dropClasses}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-over="false"
              title="Drop here your sample"
            >
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
                title="Mute / Unmute"
                onChange={(e) => onMute(name, e.target.checked)}
              />

              <button
                onClick={() => onOpenPianoRoll(name)}
                title="Piano Roll"
              >
                <MdPiano size={16} />
              </button>

              <input
                type="number"
                title="Assign to mixer"
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
                title={`Edit ${name}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (e.button === 2) onDeleteInstrument(name);
                }}
                className="font-semibold hover:bg-gray-600 text-gray-300"
              >
                {name}
              </button>

            </div>

            <div
              className="flex gap-1 p-2"
              style={{ minHeight: STEP_SIZE, maxWidth: "calc(100vw - 300px)" }}
            >
              {currentGrid.map((active, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(name, i)}
                  style={{ width: STEP_SIZE, height: STEP_SIZE }}
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
