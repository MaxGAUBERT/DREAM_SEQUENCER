// PianoRollRow.jsx
import React from "react";
import { Box } from "@mui/material";

const isBlackKey = (note) => note.includes("#");

const PianoRollRow = React.memo(
  ({ note, rowIdx, rowData, playNote, handleMouseDown, handleMouseEnter, handleMouseUp, handleMouseLeave }) => {
    return (
     <div className="flex flex-row">
  {/* Touche piano */}
  <div
    onClick={() => playNote(note)}
    className={`w-[90px] min-w-[60px] h-[22px] ${
      isBlackKey(note)
        ? "bg-[#333] text-[#eee]"
        : "bg-white text-black"
    } border-r border-[#666] border-b flex items-center pl-2 cursor-pointer text-xs font-mono sticky left-0 z-20 shadow-[2px_0px_5px_rgba(0,0,0,0.3)]`}
  >
    {note}
  </div>

  {/* Grille de notes */}
  {rowData.map((step, colIdx) => (
    <div
      key={colIdx}
      onMouseDown={(e) => {
        e.preventDefault();
        handleMouseDown(rowIdx, colIdx);
      }}
      onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`
        w-[30px] h-[22px] 
        ${step ? "bg-green-600" : isBlackKey(note) ? "bg-[#1a1a1a]" : "bg-[#222]"} 
        ${isBlackKey(note) ? "border-b border-[#2a2a2a]" : "border-b border-[#333]"} 
        border-r border-dotted border-[#444] 
        ${colIdx % 4 === 0 ? "border-l border-[#666]" : ""} 
        hover:${step ? "bg-red-600" : "bg-[#555]"} 
        cursor-pointer select-none
      `}
    />
  ))}
</div>
 
    )
  }
);

export default PianoRollRow;
