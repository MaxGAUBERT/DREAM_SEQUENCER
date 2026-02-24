import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const DEFAULT_NUM_STEPS = 16;

const makeChannel = (name, sampleUrl = null) => ({
  sampleUrl,
  muted: false,
  slot: 0,
  grids: {}, // { [patternID]: boolean[] }
});

export const useDrumRackStore = create(
  immer((set, get) => ({
    // ─── État ────────────────────────────────────────────────────────────────
    numSteps: DEFAULT_NUM_STEPS,
    instrumentList: {},          // { [name]: Channel }
    channelModalOpen: false,
    activeInstrumentName: "",    // canal sélectionné (modal, piano roll…)
    showAddInput: false,

    // ─── Steps ───────────────────────────────────────────────────────────────
    toggleStep: (instrumentName, patternID, stepIndex) =>
      set((state) => {
        const grid = state.instrumentList[instrumentName]?.grids?.[patternID];
        if (grid) grid[stepIndex] = !grid[stepIndex];
      }),

    clearPattern: (patternID) =>
      set((state) => {
        Object.values(state.instrumentList).forEach((ch) => {
          if (ch.grids[patternID]) ch.grids[patternID].fill(false);
        });
      }),

    // ─── Canaux ──────────────────────────────────────────────────────────────
    addInstrument: (name) =>
      set((state) => {
        if (!name.trim() || state.instrumentList[name]) return;
        state.instrumentList[name] = makeChannel(name);
        state.showAddInput = false;
      }),

    deleteInstrument: (name) =>
      set((state) => {
        delete state.instrumentList[name];
      }),

    deleteAllInstruments: () =>
      set((state) => {
        state.instrumentList = {};
      }),

    resetInstruments: (defaults = {}) =>
      set((state) => {
        state.instrumentList = defaults;
      }),

    muteInstrument: (name, muted) =>
      set((state) => {
        if (state.instrumentList[name]) state.instrumentList[name].muted = muted;
      }),

    setSlot: (name, slot) =>
      set((state) => {
        if (state.instrumentList[name]) state.instrumentList[name].slot = slot;
      }),

    selectSample: (name, url, displayName) =>
      set((state) => {
        const ch = state.instrumentList[name];
        if (ch) {
          ch.sampleUrl = url;
          if (displayName) ch.displayName = displayName;
        }
      }),

    renameInstrument: (oldName, newName) =>
      set((state) => {
        if (!newName.trim() || state.instrumentList[newName]) return;
        state.instrumentList[newName] = state.instrumentList[oldName];
        delete state.instrumentList[oldName];
      }),

    ensureGridForPattern: (patternID) =>
      set((state) => {
        const { numSteps, instrumentList } = state;
        Object.values(instrumentList).forEach((ch) => {
          if (!Array.isArray(ch.grids[patternID])) {
            ch.grids[patternID] = Array(numSteps).fill(false);
          }
        });
      }),

    // ─── UI ──────────────────────────────────────────────────────────────────
    setNumSteps: (n) => set({ numSteps: Math.max(8, Math.min(128, n)) }),
    openChannelModal: (name) => set({ channelModalOpen: true, activeInstrumentName: name }),
    closeChannelModal: () => set({ channelModalOpen: false }),
    setActiveInstrument: (name) => set({ activeInstrumentName: name }),
    toggleAddInput: () => set((state) => { state.showAddInput = !state.showAddInput; }),
    hideAddInput: () => set({ showAddInput: false }),

    // ─── Bulk (import/export sauvegarde) ────────────────────────────────────
    setInstrumentList: (list) => set({ instrumentList: list }),
  }))
);