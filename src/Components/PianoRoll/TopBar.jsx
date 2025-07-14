// components/PianoRoll/TopBar.jsx
import React, { useEffect } from "react";
import { ImPencil } from "react-icons/im";
import { HiPaintBrush } from "react-icons/hi2";
import { RxWidth } from "react-icons/rx";
import { IoMusicalNotesSharp } from "react-icons/io5";
import { MdOutlineDeleteOutline } from "react-icons/md";

export const CHORD_TYPES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
};

export const TopBar = ({
  selectedInstrument,
  mode,
  toggleMode,
  clearAll,
  selectedChordType,
  setSelectedChordType,
  COLS,
  setCols,
  onClose,
}) => {

  return (
    <div className="flex gap-2 mb-2 items-center ml-20">
      <label className="absolute left-0 px-4 py-2 bg-gray-800 rounded">{selectedInstrument}</label>
      <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded ml-4">X</button>
      <button onClick={() => toggleMode('draw')} className={`px-4 py-2 rounded ${mode === 'draw' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}><ImPencil size={20} /></button>
      <button onClick={() => toggleMode('paint')} className={`px-4 py-2 rounded ${mode === 'paint' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}><HiPaintBrush size={20} /></button>
      <button onClick={() => toggleMode('resize')} className={`px-4 py-2 rounded ${mode === 'resize' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}><RxWidth size={20} /></button>
      <button onClick={() => toggleMode('chords')} className={`px-4 py-2 rounded ${mode === 'chords' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}><IoMusicalNotesSharp size={20} /></button>
      <button onClick={clearAll} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"><MdOutlineDeleteOutline size={20} /></button>

      {mode === "chords" && (
        <select
          value={selectedChordType}
          onChange={(e) => setSelectedChordType(e.target.value)}
          className="p-2 ml-2 bg-gray-800 rounded"
        >
          {Object.keys(CHORD_TYPES).map((chordName) => (
            <option key={chordName} value={chordName}>{chordName}</option>
          ))}
        </select>
      )}

      <input
        type="range"
        min={8}
        max={128}
        value={COLS}
        step={4}
        onChange={(e) => setCols(Number(e.target.value))}
        className="w-20 ml-4"
      />
    </div>
  );
};

function areEqual(prev, next) {
  return (
    prev.COLS === next.COLS &&
    prev.selectedChordType === next.selectedChordType &&
    prev.toggleMode === next.toggleMode &&
    prev.setCols === next.setCols &&
    prev.setSelectedChordType === next.setSelectedChordType 
  );
}


export default React.memo(TopBar, areEqual); 



