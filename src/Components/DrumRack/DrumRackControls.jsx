// DrumRackControls.jsx
import React from "react";
import { IoAddOutline } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import { GrClearOption } from "react-icons/gr";

const iconSize = 20;

const DrumRackControls = ({ numSteps, setNumSteps, onReset, onDeleteAll, onAddToggle }) => {

  return (
    <>
      <div className="flex gap-1">
        <button onClick={onAddToggle} className="hover:text-white" title="Add channel">
          <IoAddOutline size={iconSize} />
        </button>

        <button onClick={onDeleteAll} className="hover:text-red-300" title="Delete all channels">
          <MdDeleteOutline size={iconSize} />
        </button>

        <button onClick={onReset} className="hover:text-white" title="Clear current pattern">
          <GrClearOption size={iconSize} />
        </button>
      </div>

      <input
        type="range"
        value={numSteps}
        min={8}
        max={128}
        step={1}
        title="Number of Steps"
        className="w-60 px-2 py-1 rounded border focus:border-blue-500 outline-none"
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val >= 8 && val <= 128) setNumSteps(val);
        }}
      />
    </>
  );
};

export default React.memo(DrumRackControls);
