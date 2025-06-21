import React, { useState, useRef, useEffect } from "react";

const MENU = [
  {
    id: "file",
    label: "File",
    items: ["New Project", "Load Project", "Save As", "Save", "Settings", "Exit"],
  },
  {
    id: "edit",
    label: "Edit",
    items: ["Undo", "Redo"],
  },
  {
    id: "view",
    label: "View",
    items: ["Drum Rack", "Pattern Selector", "FX Chain", "Playlist", "Sound Browser"],
  },
];

const StripMenu = React.memo(({ onAction }) =>{
  const [openDropdown, setOpenDropdown] = useState(null);
  const menuRef = useRef(null);

  // 🔒 Fermer si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownToggle = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleItemClick = (item) => {
    onAction?.(item); // facultatif
    setOpenDropdown(null);
  };

  return (
    <div
      ref={menuRef}
      className="flex bg-gray-900 border-2 z-50 border-gray-700 text-white p-1 gap-1"
    >
      {MENU.map((menu) => (
        <div key={menu.id} className="relative">
          <button
            onClick={() => handleDropdownToggle(menu.id)}
            className={`px-3 py-1 rounded-md text-sm transition-colors duration-150 ${
              openDropdown === menu.id
                ? "bg-blue-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {menu.label} 
          </button>

          {openDropdown === menu.id && (
            <div className="absolute mt-1 left-0 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
              {menu.items.map((item) => (
                <button
                  key={item}
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default StripMenu;