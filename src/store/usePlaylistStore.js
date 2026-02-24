import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const DEFAULT_WIDTH  = 16;
const DEFAULT_HEIGHT = 8;
const CELL_SIZE      = 48;
const MAX_DIM        = 100;
const MIN_DIM        = 5;

// Appelée UNE SEULE FOIS au relâchement du slider, pas à chaque tick.
function resizeCells(prev, oldW, oldH, newW, newH) {
  if (oldH === newH && oldW === newW) return prev; 

  const next = new Array(newW * newH).fill(null);  
  const minR = Math.min(oldH, newH);
  const minC = Math.min(oldW, newW);

  for (let r = 0; r < minR; r++) {
    const srcOffset = r * oldW;
    const dstOffset = r * newW;
    for (let c = 0; c < minC; c++) {
      const val = prev[srcOffset + c];           
      if (val !== null) next[dstOffset + c] = val;
    }
  }
  return next;
}

export const usePlaylistStore = create(
  immer((set, get) => ({
    cells:          new Array(DEFAULT_WIDTH * DEFAULT_HEIGHT).fill(null),
    width:          DEFAULT_WIDTH,   // dimensions réelles des cells
    height:         DEFAULT_HEIGHT,
    pendingWidth:   DEFAULT_WIDTH,   // valeur affichée pendant le drag du slider
    pendingHeight:  DEFAULT_HEIGHT,
    CELL_SIZE,

    // ── Appelé à chaque tick du slider (pas de resize du tableau) ──────────
    setWidth: (w) => {
      set({ pendingWidth: Math.max(MIN_DIM, Math.min(MAX_DIM, w)) });
    },

    setHeight: (h) => {
      set({ pendingHeight: Math.max(MIN_DIM, Math.min(MAX_DIM, h)) });
    },

    // ── Appelé au onMouseUp / onPointerUp du slider (resize effectif) ──────
    commitResize: () => {
      const { width, height, cells, pendingWidth, pendingHeight } = get();
      if (pendingWidth === width && pendingHeight === height) return;
      set({
        width:  pendingWidth,
        height: pendingHeight,
        cells:  resizeCells(cells, width, height, pendingWidth, pendingHeight),
      });
    },

    // ── Grille ─────────────────────────────────────────────────────────────
    placePattern: (index, patternID) =>
      set((s) => {
        s.cells[index] = s.cells[index] === patternID + 1 ? null : patternID + 1;
      }),

    clearCells: () =>
      set((s) => { s.cells = new Array(s.width * s.height).fill(null); }),
  }))
);