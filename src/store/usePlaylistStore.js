import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const DEFAULT_WIDTH  = 16;
const DEFAULT_HEIGHT = 8;
const CELL_SIZE      = 48;

function resizeCells(prev, oldW, oldH, newW, newH) {
  const next = Array(newW * newH).fill(null);
  const minR = Math.min(oldH, newH);
  const minC = Math.min(oldW, newW);
  for (let r = 0; r < minR; r++) {
    for (let c = 0; c < minC; c++) {
      const val = prev[r * oldW + c];
      if (val !== null) next[r * newW + c] = val;
    }
  }
  return next;
}

export const usePlaylistStore = create(
  immer((set, get) => ({
    cells:    Array(DEFAULT_WIDTH * DEFAULT_HEIGHT).fill(null),
    width:    DEFAULT_WIDTH,
    height:   DEFAULT_HEIGHT,
    CELL_SIZE,

    setWidth: (w) => {
      const { width, height, cells } = get();
      const newW = Math.max(5, Math.min(100, w));
      set({ width: newW, cells: resizeCells(cells, width, height, newW, height) });
    },

    setHeight: (h) => {
      const { width, height, cells } = get();
      const newH = Math.max(5, Math.min(100, h));
      set({ height: newH, cells: resizeCells(cells, width, height, width, newH) });
    },

    placePattern: (index, patternID) =>
      set((s) => {
        // toggle : clic sur une cellule déjà occupée par ce pattern → efface
        s.cells[index] = s.cells[index] === patternID + 1 ? null : patternID + 1;
      }),

    clearCells: () =>
      set((s) => { s.cells = Array(s.width * s.height).fill(null); }),
  }))
);