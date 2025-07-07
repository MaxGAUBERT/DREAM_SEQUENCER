// components/PianoRoll/NoteLabels.jsx
import React from 'react';

const CELL_HEIGHT = 20;

export const NoteLabels = ({ ROWS, noteLabels, handlePlaySound, isBlackKey }) => {
  return (
    <div className="flex flex-col flex-shrink-0 mt-6">
      {noteLabels.map((label, i) => (
        <button
          key={i}
          className={`w-15 h-5 border-gray-600 flex items-center justify-end ${
            isBlackKey(i) ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
          }`}
          onClick={() => handlePlaySound(null, i)}
          style={{ height: `${CELL_HEIGHT}px` }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
