// components/PatternSelector/PatternSelector.jsx
// Orchestrateur : lit le store, délègue l'affichage à ses enfants.
// Plus de prop drilling vers AddPattern / DeleteAllPatterns.
import { useEffect } from "react";
import { usePatternStore } from "../../store/usePatternStore";
import PatternButton from "./PatternButton";
import PatternContextMenu from "./PatternContextMenu";
import { useContextMenu } from "./useContextMenu";
import AddPatternButton from "./AddPatternButton";
import DeleteAllPatternsButton from "./DeleteAllPatternsButton";

const PatternSelector = () => {
  const patterns         = usePatternStore((s) => s.patterns);
  const selectedID       = usePatternStore((s) => s.selectedPatternID);
  const selectPattern    = usePatternStore((s) => s.selectPattern);
  const addPattern       = usePatternStore((s) => s.addPattern);
  const deleteAll        = usePatternStore((s) => s.deleteAllPatterns);
  const deletePattern    = usePatternStore((s) => s.deletePattern);
  const duplicatePattern = usePatternStore((s) => s.duplicatePattern);
  const renamePattern    = usePatternStore((s) => s.renamePattern);
  const resetName        = usePatternStore((s) => s.resetPatternName);
  const resetAll         = usePatternStore((s) => s.resetAll);

  // Sélection initiale
  useEffect(() => {
    if (!selectedID && patterns.length > 0) {
      selectPattern(patterns[0].id);
    }
  }, []);

  const { menu, openMenu, closeMenu } = useContextMenu();

  const handleAction = (action) => {
    const id = menu.targetId;
    switch (action) {
      case "rename":    /* géré dans PatternButton */ break;
      case "duplicate": duplicatePattern(id); break;
      case "delete":    deletePattern(id);    break;
      case "resetName": resetName(id);        break;
      case "resetAll":  resetAll();           break;
      default: break;
    }
    closeMenu();
  };

  return (
    <div className="flex flex-col gap-1 p-2 bottom-0 right-0 absolute border-2 md:h-[93%] overflow-auto scrollbar-custom">
      {menu.visible && (
        <PatternContextMenu
          x={menu.x}
          y={menu.y}
          targetId={menu.targetId}
          onAction={handleAction}
          onClose={closeMenu}
        />
      )}

      {patterns.map((pattern) => (
        <PatternButton
          key={pattern.id}
          pattern={pattern}
          isSelected={selectedID === pattern.id}
          onSelect={() => selectPattern(pattern.id)}
          onContextMenu={(e) => openMenu(e, pattern.id)}
          onRename={(name) => renamePattern(pattern.id, name)}
          // Renommage déclenché via le menu
          startRenaming={menu.targetId === pattern.id && menu.action === "rename"}
          onRenameDone={closeMenu}
        />
      ))}

      <AddPatternButton onAdd={addPattern} />
      <DeleteAllPatternsButton count={patterns.length} onDeleteAll={deleteAll} />
    </div>
  );
};

export default PatternSelector;