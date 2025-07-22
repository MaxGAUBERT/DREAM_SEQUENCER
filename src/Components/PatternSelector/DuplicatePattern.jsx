import React from "react";
import { cloneDeep } from "lodash";
import { GrDuplicate } from "react-icons/gr";

export default function DuplicatePattern({ onSelect, patterns, setPatterns, selectedPatternID, setInstrumentList }) {

  const handleDuplicatePattern = () => {
  if (!selectedPatternID) return;

  const patternToDuplicate = patterns.find(p => p.id === selectedPatternID + 1);
  if (!patternToDuplicate) console.log("Pattern to duplicate not found", patternToDuplicate);
  console.log(patternToDuplicate);

  const newId = Math.max(...patterns.map(p => p.id)) + 1;

  const duplicatedPattern = cloneDeep(patternToDuplicate);
  duplicatedPattern.id = newId;
  duplicatedPattern.name = `Pattern ${patterns.length + 1}`;

  setPatterns(prev => [...prev, duplicatedPattern]);

  // Copier aussi les grids dans instrumentList si utilisé
  setInstrumentList(prev =>
    Object.fromEntries(
      Object.entries(prev).map(([instName, instData]) => {
        const duplicatedGrid = cloneDeep(instData.grids?.[selectedPatternID] ?? []);
        return [
          instName,
          {
            ...instData,
            grids: {
              ...instData.grids,
              [newId]: duplicatedGrid
            }
          }
        ];
      })
    )
  );

  onSelect?.(newId);
};





  return (
    <button className="w-15 h-15 rounded-full border-4 border-white transition-all duration-150 ease-in-out" style={{ backgroundColor: "black" }} title="Duplicate pattern" onClick={handleDuplicatePattern}><GrDuplicate size={25}/></button>
  );
}
