import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useDrumRackStore } from "./useDrumRackStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0;
const uid = () => `pat_${Date.now()}_${_idCounter++}`;

const TAILWIND_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500",
  "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
  "bg-pink-500", "bg-rose-500",
];
export const colorByIndex = (i) => TAILWIND_COLORS[i % TAILWIND_COLORS.length];

const makePattern = (index, overrides = {}) => ({
  id: uid(),
  name: `Pattern ${index + 1}`,
  color: colorByIndex(index),
  ...overrides,
});

/** Ajoute une grille vide pour ce patternId sur tous les canaux existants. */
const syncGridAdd = (patternId, numSteps = 16) => {
  useDrumRackStore.getState().ensureGridForPattern(patternId, numSteps);
};

/** Supprime la grille de ce patternId sur tous les canaux. */
const syncGridRemove = (patternId) => {
  const { setInstrumentList, instrumentList } = useDrumRackStore.getState();
  const next = {};
  Object.entries(instrumentList).forEach(([name, data]) => {
    const grids = { ...data.grids };
    delete grids[patternId];
    next[name] = { ...data, grids };
  });
  setInstrumentList(next);
};

/** Copie les grilles d'un pattern vers un nouveau patternId. */
const syncGridDuplicate = (sourceId, newId) => {
  const { setInstrumentList, instrumentList } = useDrumRackStore.getState();
  const next = {};
  Object.entries(instrumentList).forEach(([name, data]) => {
    const grids = { ...data.grids, [newId]: [...(data.grids[sourceId] ?? [])] };
    next[name] = { ...data, grids };
  });
  setInstrumentList(next);
};

/** Vide toutes les grilles de tous les canaux. */
const syncGridClearAll = () => {
  const { setInstrumentList, instrumentList } = useDrumRackStore.getState();
  const next = {};
  Object.entries(instrumentList).forEach(([name, data]) => {
    next[name] = { ...data, grids: {} };
  });
  setInstrumentList(next);
};

// ─── Store ────────────────────────────────────────────────────────────────────

const INIT_COUNT = 4;

const buildInitialPatterns = () =>
  Array.from({ length: INIT_COUNT }, (_, i) => makePattern(i));

export const usePatternStore = create(
  immer((set, get) => ({
    patterns: buildInitialPatterns(),
    selectedPatternID: null, // sera initialisé au mount

    // ── Sélection ──────────────────────────────────────────────────────────
    selectPattern: (id) => set({ selectedPatternID: id }),

    // ── Ajout ──────────────────────────────────────────────────────────────
    addPattern: () => {
      const { patterns } = get();
      const pattern = makePattern(patterns.length);
      set((s) => { s.patterns.push(pattern); });
      syncGridAdd(pattern.id);
      get().selectPattern(pattern.id);
    },

    // ── Suppression ────────────────────────────────────────────────────────
    deletePattern: (id) => {
      const { patterns, selectedPatternID, selectPattern } = get();
      if (patterns.length <= 1) return; // garder au moins 1 pattern
      set((s) => { s.patterns = s.patterns.filter((p) => p.id !== id); });
      syncGridRemove(id);
      // Si on supprime le pattern actif, sélectionner le premier restant
      if (selectedPatternID === id) {
        selectPattern(get().patterns[0]?.id ?? null);
      }
    },

    deleteAllPatterns: () => {
      set((s) => { s.patterns = []; s.selectedPatternID = null; });
      syncGridClearAll();
    },

    // ── Duplication ────────────────────────────────────────────────────────
    duplicatePattern: (id) => {
      const { patterns } = get();
      const source = patterns.find((p) => p.id === id);
      if (!source) return;
      const newPat = makePattern(patterns.length, { name: source.name });
      set((s) => { s.patterns.push(newPat); });
      syncGridDuplicate(id, newPat.id);
      get().selectPattern(newPat.id);
    },

    // ── Renommage ──────────────────────────────────────────────────────────
    renamePattern: (id, name) => {
      if (!name.trim() || name.length > 20) return;
      set((s) => {
        const p = s.patterns.find((p) => p.id === id);
        if (p) p.name = name.trim();
      });
    },

    resetPatternName: (id) => {
      set((s) => {
        const idx = s.patterns.findIndex((p) => p.id === id);
        if (idx !== -1) s.patterns[idx].name = `Pattern ${idx + 1}`;
      });
    },

    // ── Reset global ────────────────────────────────────────────────────────
    resetAll: () => {
      const fresh = buildInitialPatterns();
      set({ patterns: fresh, selectedPatternID: fresh[0].id });
      syncGridClearAll();
      fresh.forEach((p) => syncGridAdd(p.id));
    },
  }))
);