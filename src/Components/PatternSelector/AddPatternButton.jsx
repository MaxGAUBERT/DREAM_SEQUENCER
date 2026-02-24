// components/PatternSelector/AddPatternButton.jsx
import React from "react";

const AddPatternButton = ({ onAdd }) => (
  <button
    onClick={onAdd}
    className="w-15 h-15 rounded-full border-4 border-white bg-black transition-all duration-150 ease-in-out hover:bg-gray-800"
    title="Add pattern"
  >
    +
  </button>
);

export default React.memo(AddPatternButton);