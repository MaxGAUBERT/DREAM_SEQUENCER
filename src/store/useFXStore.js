import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const FX_NAMES = [
  "Reverberator",
  "Hypno Chorus",
  "Super Delay",
  "Complex Distortion",
];

export const DEFAULT_FX_PARAMS = {
  Reverberator:        { decay: 1.5, wet: 0.4 },
  "Hypno Chorus":      { rate: 1.5,  depth: 0.7, feedback: 0.1 },
  "Super Delay":       { delayTime: "8n", feedback: 0.5 },
  "Complex Distortion":{ distortion: 0.8, oversample: "4x" },
};

// Nombre de slots insert + 1 master
const SLOT_COUNT = 8;
export const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i); // [0,1,…,7]

export const useFXStore = create(
  immer((set) => ({
    // slot sélectionné dans l'UI
    selectedSlot: { channel: null, slot: 0 },

    // FX assigné par canal : { [instrumentName]: fxName | null }
    channelFX: {},

    // Volume par canal (0–50, affiché ; converti en dB dans le hook audio)
    channelVolume: {},

    setSelectedSlot: (slot) => set({ selectedSlot: slot }),

    setChannelFX: (instrumentName, fxName) =>
      set((s) => { s.channelFX[instrumentName] = fxName ?? null; }),

    setChannelVolume: (instrumentName, value) =>
      set((s) => { s.channelVolume[instrumentName] = value; }),
  }))
);