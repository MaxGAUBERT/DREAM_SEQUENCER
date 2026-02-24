import { useCallback } from "react";
import { useDrumRackStore } from "../../store/useDrumRackStore";
import { useHistoryContext } from "../../Contexts/HistoryProvider";

export function usePianoRollNotes(selectedInstrument, selectedPatternID) {
  const setInstrumentList = useDrumRackStore((s) => s.setInstrumentList);
  const instrumentList    = useDrumRackStore((s) => s.instrumentList);
  const { dispatchAction } = useHistoryContext();

  // ── Lecture ───────────────────────────────────────────────────────────────
  const getNotes = useCallback(() => {
    return instrumentList[selectedInstrument]?.pianoData?.[selectedPatternID] ?? [];
  }, [instrumentList, selectedInstrument, selectedPatternID]);

  // ── Écriture atomique avec historique ─────────────────────────────────────
  const setNotes = useCallback((updater) => {
    const inst = useDrumRackStore.getState().instrumentList[selectedInstrument];
    if (!inst) return;

    const prevNotes = inst.pianoData?.[selectedPatternID] ?? [];
    const nextNotes = typeof updater === "function" ? updater(prevNotes) : updater;

    // Pas de changement → bail out
    if (
      prevNotes === nextNotes ||
      (prevNotes.length === nextNotes.length && prevNotes.every((v, i) => v === nextNotes[i]))
    ) return;

    const applyNotes = (notes) => {
      const current = useDrumRackStore.getState().instrumentList;
      const target  = current[selectedInstrument];
      if (!target) return;
      setInstrumentList({
        ...current,
        [selectedInstrument]: {
          ...target,
          pianoData: { ...target.pianoData, [selectedPatternID]: notes },
        },
      });
    };

    applyNotes(nextNotes);

    dispatchAction({
      type:    "setNotes",
      payload: { selectedInstrument, selectedPatternID },
      apply:   () => applyNotes(nextNotes),
      revert:  () => applyNotes(prevNotes),
    });
  }, [selectedInstrument, selectedPatternID, setInstrumentList, dispatchAction]);

  // ── Actions métier ────────────────────────────────────────────────────────
  const addNote = useCallback((note) => {
    setNotes((prev) => [...prev, note]);
  }, [setNotes]);

  const removeNote = useCallback((noteId) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, [setNotes]);

  const updateNote = useCallback((noteId, patch) => {
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, ...patch } : n));
  }, [setNotes]);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, [setNotes]);

  const filterNotesInRange = useCallback((maxCols) => {
    setNotes((prev) => prev.filter((n) => n.start < maxCols));
  }, [setNotes]);

  return { getNotes, setNotes, addNote, removeNote, updateNote, clearNotes, filterNotesInRange };
}