// components/PatternSelector/DeleteAllPatternsButton.jsx
import React from "react";
import { MdDeleteSweep } from "react-icons/md";
import { useGlobalColorContext } from "../../Contexts/GlobalColorContext";

const DeleteAllPatternsButton = ({ count, onDeleteAll }) => {
  const { colorsComponent } = useGlobalColorContext();

  if (count <= 1) return null;

  return (
    <button
      onClick={onDeleteAll}
      className="w-15 h-15 rounded-full border-4 bg-black transition-all duration-150 ease-in-out hover:bg-gray-800 flex items-center justify-center"
      style={{ borderColor: colorsComponent.Border }}
      title="Delete all patterns"
    >
      <MdDeleteSweep size={25} />
    </button>
  );
};

export default React.memo(DeleteAllPatternsButton);