import React, { useState, useRef, useEffect } from "react";

const InstrumentInput = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      setName("");
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <input
        ref={inputRef}
        type="text"
        placeholder="Nom du canal"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
          if (e.key === "Escape") onCancel();
        }}
        className="px-2 py-1 rounded border border-gray-600 bg-gray-800 focus:border-blue-500 outline-none"
      />
      <button
        onClick={handleConfirm}
        disabled={!name.trim()}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded"
      >
        Confirmer
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1 hover:bg-gray-700 rounded"
      >
        Annuler
      </button>
    </div>
  );
};

export default React.memo(InstrumentInput);