import { useState } from "react";

const WIDTH = 30; // nombre de colonnes
const HEIGHT = 30; // nombre de lignes
const CELL_SIZE = 50; // taille en pixels

const Playlist = () => {
  const [cells, setCells] = useState(Array(WIDTH * HEIGHT).fill(0));

  const toggleCell = (index) => {
    setCells((prevCells) =>
      prevCells.map((c, i) => (i === index ? 1 - c : c))
    );
  };

  return (
    <div
      className="grid z-25 border-5 border-white resize bg-gray-500 overflow-auto w-300 max-w-1/2 max-h-120 absolute top-20"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${WIDTH}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${HEIGHT}, ${CELL_SIZE}px)`,
        gap: "3px",
      }}
    >
      {cells.map((cell, index) => (
        <button
          key={index}
          onClick={() => toggleCell(index)}
          style={{
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            backgroundColor: cell === 0 ? "white" : "red",
            border: "1px solid #ccc",
          }}
        />
      ))}
    </div>
  );
};

export default Playlist;
