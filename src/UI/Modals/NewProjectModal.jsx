import { useState } from "react";


export default function NewProjectModal({onClose, onCreate}) {
  const [newProjectName, setNewProjectName] = useState('');
  const handleCreateProject = () => {
    onCreate(newProjectName);
    onClose();
  }

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md relative">
        <h2 className="text-2xl text-black font-bold mb-4">Create New Project</h2>
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full px-4 py-2 border text-black rounded"
          />
          <button
            type="button"
            onClick={handleCreateProject}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create
          </button>
        </form>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </div>
    </div>
    )
}