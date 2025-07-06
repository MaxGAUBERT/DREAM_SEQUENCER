import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useProjectManager } from "../Hooks/useProjectManager";
// ✅ corriger ici
const ShortcutContext = createContext(null);
export const useShortcutContext = () => useContext(ShortcutContext);

const ShortcutProvider = ({ children }) => {
  const {saveAsProject, loadProject, deleteProject, createProject, saveProject } = useProjectManager();
  const [shortcut, setShortcut] = useState({
    "New": "Control+N",
    "Open": "Control+O",
    "Save": "Control+S",
    "Save As": "Control+Shift+S",
    "Settings": "Control+,",
    "Exit": "Control+Q",
    "Undo": "Control+Z",
    "Redo": "Control+Y",
    "Drum Rack": "Shift+D",
    "Pattern Selector": "Shift+P",
    "FX Chain": "Shift+F",
    "Playlist": "Shift+L",
    "Add Channel": "+",
    "Delete Channel": "-",
    "Clear Steps": "Control+Shift+C",
    "Mute": "Control+M",
    "Upload": "Shift+U"
  });

  const shortcutActions = {
    "Control+S": () => saveCurrentProject(),
    "Control+Shift+S": () => saveAsProject(),
    "Control+N": () => createProject(),
    "Control+O": () => loadProject(),
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = ["INPUT", "TEXTAREA"].includes(e.target.tagName);
      if (isTyping) return;

      const keys = [];
      if (e.ctrlKey) keys.push("Control");
      if (e.shiftKey) keys.push("Shift");
      if (e.altKey) keys.push("Alt");
      if (e.metaKey) keys.push("Meta");

      const mainKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      keys.push(mainKey);

      const combo = keys.join("+");

      if (shortcutActions[combo]) {
        e.preventDefault();
        shortcutActions[combo]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutActions]);

  const value = useMemo(() => ({
    shortcut,
    setShortcut,
  }), [shortcut]);

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
};

export default ShortcutProvider;
