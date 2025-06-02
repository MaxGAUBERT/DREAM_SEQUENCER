import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";

export const PatternRenamer = ({ selectedPattern }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim() !== "") {
      renamePattern(name);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    setName(selectedPattern?.name || "");
  }, [selectedPattern]);
  

  return (
    <>
      {isEditing ? (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
          className="absolute top-[45px] left-[10px] bg-gray-500 text-white px-2 py-1 text-sm rounded border border-gray-400 focus:outline-none"
        />
      ) : (
        <div>
          <button
            className="p-1 text-gray-700 hover:text-black"
            onClick={() => setIsEditing(true)}
          >
            <FaEdit className="text-sm" />
          </button>
        </div>
      )}
    </>
  );
};