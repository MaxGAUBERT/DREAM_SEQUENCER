import { useState, useEffect } from "react";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { useNavigate } from "react-router-dom";
import { MdOutlineCreateNewFolder } from "react-icons/md";

const HomePage = ({ onNewProject = () => {} }) => {
    const [projectName, setProjectName] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [existingProjects, setExistingProjects] = useState([]);

    const navigate = useNavigate();

    const handleCreateProject = () => {
        if (!projectName.trim()) {
            alert("Veuillez entrer un nom de projet.");
            return;
        }

        if (existingProjects.includes(projectName.trim())) {
            alert("Ce nom de projet existe déjà. Veuillez choisir un autre nom.");
            return;
        }

        const newProject = {
            name: projectName.trim(),
            players: {},
            grids: {},
            patterns: [{ players: {}, grids: {}, id: 1, name: "Pattern 1" }],
            createdAt: Date.now(),
        };

        localStorage.setItem("projectName", newProject.name);

        // Callback + fermeture + navigation
        onNewProject(newProject);
        setShowModal(false);
        setProjectName(newProject.name);
        
        // Navigation simulée
        navigate("/LaunchAnimation");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCreateProject();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6">
            {/* Header avec logo et titre */}
            <div className="flex flex-col items-center mb-12 text-center">
                <div className="relative mb-6">
                    <GraphicEqIcon 
                        fontSize="large"
                        className="text-white drop-shadow-4xl filter brightness-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold font-[silkscreen] text-teal-50 shadow-amber-800 tracking-wider mb-2">
                    DREAM SEQUENCER
                </h1>
                <p className="text-blue-200 text-lg opacity-80">
                    Your unique sequence
                </p>
            </div>

            {/* Bouton New Project stylé */}
            <button
                onClick={() => setShowModal(true)}
                className="group relative px-12 py-4 bg-gradient-to-r from-green-500 to-red-600 text-white font-bold text-xl rounded-xl shadow-2xl hover:from-cyan-400 hover:to-blue-500 transform hover:scale-105 transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
            >
                <span className="relative z-10 flex items-center gap-3">
                    New Project
                </span>
                
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:animate-pulse rounded-xl"></div>
                
                {/* Ombre animée */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>
            </button>

            {/* Modal de création de projet */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay avec effet de blur */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    ></div>
                    
                    {/* Modal Panel */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-md w-full mx-4 transform animate-pulse">
                        {/* Header du modal */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MdOutlineCreateNewFolder className="text-3xl text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Project</h2>
                        </div>
                        
                        {/* Input avec style amélioré */}
                        <div className="mb-8">
                            <input
                                type="text"
                                placeholder="Enter project name..."
                                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoFocus
                            />
                        </div>
                        
                        {/* Boutons d'action */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setProjectName("");
                                }}
                                className="flex-1 px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProject}
                                disabled={!projectName.trim()}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;