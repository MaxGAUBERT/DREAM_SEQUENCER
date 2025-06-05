import { useState } from "react";

export default function NewProjectCreator({ createProject, onClose }) {
  const [projectName, setProjectName] = useState("");

  const handleCreate = () => {
        if (projectName.trim()) {
            createProject(projectName.trim());
        }

        onClose();

    }


  return (
    <div className="absolute w-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-md shadow-2xl z-[1000]">
      <h2 className="text-lg font-semibold mb-4">Create a new project</h2>

      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="New project name"
        className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleCreate}
          disabled={!projectName.trim()}
          className={`px-4 py-2 rounded-md text-white transition ${
            projectName.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Create
        </button>
      </div>
    </div>
  );
}


