// InstrumentInput.jsx
import React from "react";

const InstrumentInput = ({ instrumentName, setInstrumentName, onConfirm, onCancel }) => {
  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        placeholder="Channel name"
        value={instrumentName}
        onChange={(e) => setInstrumentName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirm(e);
        }}
        className="px-2 py-1 rounded border focus:border-blue-500 outline-none"
        autoFocus
      />
      <button
        onClick={onConfirm}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        Confirm
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1 hover:bg-gray-700 rounded"
      >
        Cancel
      </button>
    </div>
  );
};

export default React.memo(InstrumentInput);
