import React from "react";

const STEP_SIZE = 24;

const StepGrid = ({ name, grid, onToggleStep }) => (
  <div
    className="flex gap-1 p-2"
    style={{ minHeight: STEP_SIZE, maxWidth: "calc(100vw - 300px)" }}
  >
    {grid.map((active, i) => (
      <button
        key={i}
        onClick={() => onToggleStep(name, i)}
        style={{ width: STEP_SIZE, height: STEP_SIZE }}
        className={`rounded transition-colors ${active ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"}`}
        aria-label={`Step ${i + 1} ${active ? "actif" : "inactif"}`}
        aria-pressed={active}
      />
    ))}
  </div>
);

export default React.memo(StepGrid);