import { useState } from "react";

const ProjectLoader = ({ projects, onLoadProject, onDeleteProject, datasToSave, onClose }) => {
  const [selectedProject, setSelectedProject] = useState("");

  const handleSelect = (event) => {
    setSelectedProject(event.target.value);
  };

  const handleLoad = () => {
    if (selectedProject && datasToSave) {
      onLoadProject(selectedProject);
    }
  };

  return (
    <div className="absolute w-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-md shadow-2xl z-[1000]">
      <h2 className="text-lg font-semibold mb-4">Load a project</h2>

      <div className="w-full mb-4">
        <label htmlFor="project-select" className="block mb-1 text-gray-700 font-medium">
          Available projects
        </label>
        <select
          id="project-select"
          value={selectedProject}
          onChange={handleSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>Select a project</option>
          {projects && Object.entries(projects).map(([name, data]) => {
            const patternCount = data.patterns?.length || 0;
            return (
              <option key={name} value={name}>
                {name} ({patternCount} pattern{patternCount !== 1 ? "s" : ""})
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100 transition"
          style={{ color: "white" }}
        >
          Cancel
        </button>
        <button
          onClick={handleLoad}
          disabled={!selectedProject}
          className={`px-4 py-2 rounded-md text-white transition ${
            selectedProject ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Load
        </button>
        <button
          onClick={onDeleteProject}
          className="px-4 py-2 text-red-600 border border-red-500 rounded-md hover:bg-red-100 transition"
        >
          Delete All Projects
        </button>
      </div>
    </div>
  );
};

export default ProjectLoader;
