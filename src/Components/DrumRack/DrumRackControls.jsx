import React from "react";
import { IoAddOutline } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import { GrClearOption } from "react-icons/gr";
import { RiResetLeftLine } from "react-icons/ri";

const ICON_SIZE = 20;

const controls = [
  { icon: IoAddOutline,    handler: "onAddToggle",  label: "Ajouter un canal",             className: "hover:text-white" },
  { icon: MdDeleteOutline, handler: "onDeleteAll",  label: "Supprimer tous les canaux",    className: "hover:text-red-300" },
  { icon: GrClearOption,   handler: "onClear",      label: "Vider les steps du pattern",   className: "hover:text-white" },
  { icon: RiResetLeftLine, handler: "onReset",      label: "Réinitialiser les canaux",     className: "hover:text-white" },
];

const DrumRackControls = ({ numSteps, onSetNumSteps, onClear, onReset, onDeleteAll, onAddToggle }) => {
  const handlers = { onAddToggle, onDeleteAll, onClear, onReset };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {controls.map(({ icon: Icon, handler, label, className }) => (
          <button
            key={handler}
            onClick={handlers[handler]}
            className={className}
            title={label}
            aria-label={label}
          >
            <Icon size={ICON_SIZE} />
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-400">
        Steps : {numSteps}
        <input
          type="range"
          value={numSteps}
          min={8}
          max={128}
          step={1}
          aria-label="Nombre de steps"
          className="w-48"
          onChange={(e) => onSetNumSteps(Number(e.target.value))}
        />
      </label>
    </div>
  );
};

export default React.memo(DrumRackControls);