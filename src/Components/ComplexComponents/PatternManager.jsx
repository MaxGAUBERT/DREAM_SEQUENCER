import React, { useState, useEffect, useCallback } from "react";
import { GrDuplicate } from "react-icons/gr";
import { PatternRenamer } from "../FrontEnd/PatternRenamer";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { MdMenu } from "react-icons/md";
import { useHoverInfo } from '../Contexts/HoverInfoContext';
const PatternManager = ({
  patterns,
  selectPattern,
  selectedPattern,
  addPattern,
  deletePattern,
  duplicatePattern
}) => {
  const [anchorOpen, setAnchorOpen] = useState(false);
  const {createHoverProps} = useHoverInfo();
  
  const renamePattern = (newName) => {
  if (selectedPattern && typeof selectedPattern.id === "number") {
    
    const updatedPatterns = patterns.map((pattern) => {
      if (pattern.id === selectedPattern.id) {
        return { ...pattern, name: newName };
      }
      return pattern;
    });
    selectPattern(updatedPatterns);
  }
};


 return (
    <div

      className="fixed top-[25px] left-[58.5%] -translate-x-1/2 -translate-y-1/2 bg-gray-500 flex flex-row flex-wrap gap-2 z-[2000] p-2 rounded shadow-md"
    >
      {/* Sélecteur de pattern */}
      <select 
      {...createHoverProps("Pattern selector")}
        
        value={selectedPattern?.id?.toString() || ""}
        onChange={(e) => {
          const patternId = parseInt(e.target.value);
          const selected = patterns.find((p) => p.id === patternId);
          if (selected && typeof selectPattern === "function") {
            selectPattern(selected);
          }
        }}
        className="text-white bg-gray-700 border border-gray-600 rounded px-2 py-1 max-w-[100px] text-sm focus:outline-none"
      >
        <option value="">Select a pattern</option>
        {patterns.map((p) => (
          <option key={p.id} value={p.id.toString()}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Bouton menu déroulant */}
      <div className="relative">
        <button
          onClick={() => setAnchorOpen(!anchorOpen)}
          className="bg-gray-800 hover:bg-gray-900 text-white w-6 h-6 flex items-center justify-center rounded"
        >
          <MdMenu fontSize="small" />
        </button>

        {anchorOpen && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg w-40 text-sm z-20">
            <button
            {...createHoverProps("Add pattern")}
              onClick={() => {
                addPattern();
                setAnchorOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <FaPlus />
              Add
            </button>
            <button
            {...createHoverProps("Delete pattern")}
              onClick={() => {
                deletePattern();
                setAnchorOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <FaMinus />
              Delete
            </button>
            <button
            {...createHoverProps("Duplicate pattern")}
              onClick={() => {
                duplicatePattern();
                setAnchorOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <GrDuplicate />
              Duplicate
            </button>

        
          </div>
        )}
      </div>

      {/* Renommage */}
      <PatternRenamer selectedPattern={selectedPattern} renamePattern={renamePattern} />

    </div>
  );
};

export default PatternManager;