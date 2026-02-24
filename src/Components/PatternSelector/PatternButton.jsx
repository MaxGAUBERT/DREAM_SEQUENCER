// components/PatternSelector/PatternButton.jsx
// Bouton d'un pattern avec renommage inline.
// Le renommage est déclenché de l'extérieur via startRenaming.
import React, { useState, useEffect, useRef } from "react";

const PatternButton = ({
  pattern,
  isSelected,
  onSelect,
  onContextMenu,
  onRename,
  startRenaming,
  onRenameDone,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(pattern.name);
  const inputRef              = useRef(null);

  // Démarrer le renommage quand le parent le demande
  useEffect(() => {
    if (startRenaming) {
      setDraft(pattern.name);
      setEditing(true);
    }
  }, [startRenaming]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    if (draft.trim() && draft.length <= 20) onRename(draft.trim());
    setEditing(false);
    onRenameDone?.();
  };

  const cancel = () => {
    setDraft(pattern.name);
    setEditing(false);
    onRenameDone?.();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter")  commit();
          if (e.key === "Escape") cancel();
        }}
        maxLength={20}
        className="w-20 px-1 rounded border border-white bg-black text-white text-sm"
      />
    );
  }

  return (
    <button
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`flex flex-col items-center justify-center w-15 h-15 rounded-full border-4 transition-all duration-150 ease-in-out
        ${isSelected ? "border-white" : "border-transparent"} ${pattern.color}`}
      title={pattern.name}
    >
      {pattern.name}
    </button>
  );
};

export default React.memo(PatternButton);