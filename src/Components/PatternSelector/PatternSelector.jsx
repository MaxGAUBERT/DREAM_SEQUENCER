import { useState, useEffect } from "react";
import AddPattern from "./AddPattern";
import DeleteAllPatterns from "./DeleteAllPatterns";

const PatternSelector = ({
  patterns,
  setPatterns,
  colorByIndex,
  initLength,
  onSelect,
  selectedPatternID,
  setInstrumentList,
}) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
  });

  const [renameInput, setRenameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Fermeture menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.visible]);

  
  const handleMenuAction = (action) => {
    const targetId = contextMenu.targetId;
    if (!targetId) return;

    switch (action) {
      case "rename":
        const p = patterns.find((p) => p.id === targetId);
        if (p) setRenameInput(p.name);
        setIsRenaming(true);
        break;

      case "duplicate":
        const patternToDup = patterns.find((p) => p.id === targetId);
        if (patternToDup) {
          const newPattern = {
            ...patternToDup,
            id: Date.now(),
            name: patternToDup.name,
          };
          setPatterns((prev) => [...prev, newPattern]);
        }
        break;

      case "delete":
        setPatterns((prev) => prev.filter((p) => p.id !== targetId));
        break;

      case "reset":
        setPatterns((prev) =>
          prev.map((p) =>
            p.id === targetId ? { ...p, name: `pattern ${p.id + 1}` } : p
          )
        );
        break;

      case "resetAll": {
        const resetPatterns = Array.from({ length: initLength }, (_, i) => ({
          id: i,
          name: `Pattern ${i + 1}`,
          color: colorByIndex(i),
        }));

        setPatterns(resetPatterns);
        onSelect(0);

        setInstrumentList((prev) => {
          const newList = { ...prev };
          Object.keys(newList).forEach((inst) => {
            newList[inst] = {
              ...newList[inst],
              grids: resetPatterns.reduce((acc, pattern) => {
                acc[pattern.id] = Array(initLength).fill(false);
                return acc;
              }, {}),
            };
          });
          return newList;
        });
        break;
      }

      default:
        break;
    }

    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Raccourcis clavier globaux
   useEffect(() => {
  const handleGlobalShortcut = (e) => {
    if (!contextMenu.visible) return;

    if (e.ctrlKey && e.key.toLowerCase() === "n") {
      e.preventDefault();
      e.stopPropagation();
      handleMenuAction("reset");
    }
    if (e.ctrlKey && e.key.toLowerCase() === "r") {
      e.preventDefault();
      e.stopPropagation();
      handleMenuAction("rename");
    }
    if (e.ctrlKey && e.key.toLowerCase() === "d") {
      e.preventDefault();
      e.stopPropagation();
      handleMenuAction("duplicate");
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      e.stopPropagation();
      handleMenuAction("resetAll");
    }
  };

  // utilisation de `true` pour activer la phase de capture
  window.addEventListener("keydown", handleGlobalShortcut, true);
  return () => {
    window.removeEventListener("keydown", handleGlobalShortcut, true);
  };
}, [contextMenu.visible]);


  // Clic droit sur un pattern → ouvre le menu
  const handleContextMenu = (e, patternId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId: patternId,
    });
  };


  // Valider renommage
  const handleRenameSubmit = () => {
    if (!renameInput.trim() || renameInput.length > 9) {
      setIsRenaming(false);
      return;
    }
    setPatterns((prev) =>
      prev.map((p) =>
        p.id === contextMenu.targetId ? { ...p, name: renameInput.trim() } : p
      )
    );
    setIsRenaming(false);
  };

  return (
    <div className="flex flex-col gap-4 p-2 bottom-0 right-0 absolute border-4 md:h-[93%] overflow-auto border-gray-700 scrollbar-custom">
      {contextMenu.visible && (
        <div
          className="bg-gray-800 text-white border border-gray-300 shadow-lg rounded-md overflow-hidden"
          style={{
            position: "fixed",
            top: contextMenu.y / 2,
            left: contextMenu.x / 2 + 450,
            zIndex: 1000,
            minWidth: 180,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
            onClick={() => handleMenuAction("rename")}
          >
            Rename (CTRL + R)
          </div>
          <div
            className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
            onClick={() => handleMenuAction("duplicate")}
          >
            Duplicate (CTRL + D)
          </div>
          <div
            className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
            onClick={() => handleMenuAction("reset")}
          >
            Reset name (CTRL + N)
          </div>
          <div
            className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-red-400"
            onClick={() => handleMenuAction("delete")}
          >
            Remove (SUPPR)
          </div>
          <div
            className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
            onClick={() => handleMenuAction("resetAll")}
          >
            Reset All (CTRL + SHIFT + A)
          </div>
        </div>
      )}

      {patterns.map((pattern) =>
        isRenaming && contextMenu.targetId === pattern.id ? (
          <input
            key={pattern.id}
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            className="w-20 px-1 rounded border border-white bg-black text-white text-sm"
            autoFocus
          />
        ) : (
          <button
            key={pattern.id}
            onClick={() => onSelect(pattern.id)}
            onContextMenu={(e) => handleContextMenu(e, pattern.id)}
            className={`flex flex-col items-center justify-center w-15 h-15 rounded-full border-4 transition-all duration-150 ease-in-out ${
              selectedPatternID === pattern.id
                ? "border-white"
                : "border-transparent"
            } ${pattern.color}`}
            title={pattern.name}
          >
            {pattern.name}
          </button>
        )
      )}

      <AddPattern
        onSelect={onSelect}
        patterns={patterns}
        setPatterns={setPatterns}
        colorByIndex={colorByIndex}
        setInstrumentList={setInstrumentList}
      />
      <DeleteAllPatterns
        patterns={patterns}
        setPatterns={setPatterns}
        setInstrumentList={setInstrumentList}
        selectedPatternID={selectedPatternID}
        onSelect={onSelect}
      />
    </div>
  );
};

export default PatternSelector;
