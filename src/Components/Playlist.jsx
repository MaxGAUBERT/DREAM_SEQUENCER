import { useState } from "react";
import { MdDelete } from "react-icons/md";

const WIDTH = 30; // nombre de colonnes
const HEIGHT = 30; // nombre de lignes
const CELL_SIZE = 50; // taille en pixels

const Playlist = ({onSelectPattern, selectedPatternID}) => {
  const [cells, setCells] = useState(Array(WIDTH * HEIGHT).fill(0));

  const placePattern = (index) => {
  setCells(prev => {
    const newCells = [...prev];
    
    // Si la case contient déjà le pattern sélectionné, on l'efface
    if (newCells[index] === selectedPatternID + 1) {
      newCells[index] = null;
      console.log("Pattern removed at index", index);
    } else {
      newCells[index] = selectedPatternID + 1;
      console.log("Pattern placed at index", index, "with:", selectedPatternID);
    }

    return newCells;
  });
};



  return (
    <div
      className="grid z-25 border-2 pt-15 border-white resize bg-gray-800 overflow-auto w-300 max-w-1/2 max-h-120 absolute top-20"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${WIDTH}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${HEIGHT}, ${CELL_SIZE}px)`,
        gap: "3px",
      }}
    >
      <div className="absolute top-0 text-center">
        <button 
          onClick={() => setCells(Array(WIDTH * HEIGHT).fill(0))}
          style={{
            width: `${CELL_SIZE + 5}px`,
            height: `${CELL_SIZE}px`,
            border: "2px solid #ccc",
            backgroundColor: "red"
          }}
        >
          <MdDelete size={20}/>
        </button>
      </div>
      {cells.map((cell, index) => (
      <button
        key={index}
        onClick={() => placePattern(index)}
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          border: "1px solid #ccc",
          backgroundColor: cell ? '#aad' : '#fff',
        }}
      >
        {cell ? `P${cell}` : ''}
      </button>
    ))}
    </div>
    );
};

export default Playlist;
