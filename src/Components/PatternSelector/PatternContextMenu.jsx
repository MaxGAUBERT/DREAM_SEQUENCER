import React, { useEffect, useRef } from "react";

const MENU_ITEMS = [
  { action: "rename",    label: "Rename",       shortcut: "Ctrl+R", danger: false },
  { action: "duplicate", label: "Duplicate",    shortcut: "Ctrl+D", danger: false },
  { action: "resetName", label: "Reset name",   shortcut: "Ctrl+N", danger: false },
  { action: "delete",    label: "Remove",       shortcut: "Del",    danger: true  },
  { action: "resetAll",  label: "Reset all",    shortcut: "Ctrl+Shift+A", danger: false },
];

const PatternContextMenu = ({ x, y, onAction, onClose }) => {
  const menuRef = useRef(null);

  // Ajuste la position si le menu déborde de l'écran
  useEffect(() => {
    if (!menuRef.current) return;
    const { right, bottom } = menuRef.current.getBoundingClientRect();
    const el = menuRef.current;
    if (right > window.innerWidth)  el.style.left = `${x - el.offsetWidth}px`;
    if (bottom > window.innerHeight) el.style.top = `${y - el.offsetHeight}px`;
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] min-w-[180px] bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden text-white text-sm"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {MENU_ITEMS.map(({ action, label, shortcut, danger }) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          className={`w-full flex justify-between items-center px-3 py-2 hover:bg-gray-700 transition-colors text-left
            ${danger ? "text-red-400" : ""}`}
        >
          <span>{label}</span>
          <span className="text-xs text-gray-500 ml-4">{shortcut}</span>
        </button>
      ))}
    </div>
  );
};

export default React.memo(PatternContextMenu);