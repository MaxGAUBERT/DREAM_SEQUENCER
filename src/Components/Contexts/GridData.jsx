import { createContext, useContext, useMemo, useState } from "react";

const GridDataContext = createContext({});

export const useGridData = () => useContext(GridDataContext);

// Génère une liste de notes ascendantes (C3 → B5)
const generateNoteList = (num) => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const result = [];
  let octave = 3;
  let noteIndex = 0;
  for (let i = 0; i < num; i++) {
    result.push(notes[noteIndex] + octave);
    noteIndex++;
    if (noteIndex >= notes.length) {
      noteIndex = 0;
      octave++;
    }
  }
  return result;
};

export const GridData = ({ children, rows = 24 }) => {
  const [grids, setGrids] = useState({});
  const noteList = useMemo(() => generateNoteList(rows).reverse(), [rows]);

  const [noteData, setNoteData] = useState({});

  return (
    <GridDataContext.Provider value={{ noteList, noteData, grids, setGrids, setNoteData }}>
      {children}
    </GridDataContext.Provider>
  );
};

export default GridData;
