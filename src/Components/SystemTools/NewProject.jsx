import React, { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { Button, TextField, Typography, Paper, Box } from "@mui/material";
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

const NewProject = ({ onNewProject = () => {} }) => {
    const navigate = useNavigate();
    const [projectName, setProjectName] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [existingProjects, setExistingProjects] = useState([]);

    // ✅ Charger les projets existants depuis localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem("projects");
            const projects = stored ? JSON.parse(stored) : {};
            setExistingProjects(Object.keys(projects));
        } catch (error) {
            console.error("Erreur lors du parsing des projets :", error);
            localStorage.removeItem("projects"); // On nettoie si c'est corrompu
            setExistingProjects([]);
        }
    }, []);
    

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
            playlist: {
                initGrid: Array.from({ length: 8 }, () => Array.from({ length: 16 }, () => null))
            },
            createdAt: Date.now(),
        };

        // ✅ Récupérer ou initialiser les projets existants
        const storedProjects = JSON.parse(localStorage.getItem("projects")) || {};
        storedProjects[projectName.trim()] = newProject;

        // ✅ Enregistrer les projets mis à jour
        localStorage.setItem("projects", JSON.stringify(storedProjects));

        // ✅ Enregistrer le projet actif
        localStorage.setItem("projectName", projectName.trim());

        // ✅ Callback + fermeture + navigation
        onNewProject(projectName.trim());
        setShowModal(false);
        navigate("/LaunchAnimation");
    };

    return (
        <Box textAlign="center" p={3}>
            <GraphicEqIcon sx={{ color: "black", fontSize: "80px", boxShadow: "10px 8px 8px rgba(0, 0, 0, 0.2)" }}/>
            <Typography variant="h2" fontFamily="Silkscreen, cursive" color="black">
                DREAM SEQUENCER
            </Typography>
            <Box mt={2}>
                <Button variant="contained" color="black" onClick={() => setShowModal(true)}>
                    New Project
                </Button>
            </Box>

            {/* Modal de création de projet */}
            <Transition appear show={showModal} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => {}} static={true}>
                    <Box sx={{ display: "flex", justifyContent: "center", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                        <Dialog.Panel>
                            <Paper elevation={3} sx={{ position: "absolute", top: "70%", left: "50%", transform: "translate(-50%, -50%)", padding: 3, minWidth: 300 }}>
                                <Typography variant="h6">Create a New Project</Typography>
                                <TextField
                                    fullWidth
                                    label="Project Name"
                                    variant="outlined"
                                    margin="normal"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                />
                                <Box mt={2} display="flex" justifyContent="space-between">
                                    <Button onClick={() => setShowModal(!showModal)} color="error">
                                        Cancel
                                    </Button>
                                    <Button variant="contained" color="primary" onClick={handleCreateProject}>
                                        Create
                                    </Button>
                                </Box>
                            </Paper>
                        </Dialog.Panel>
                    </Box>
                </Dialog>
            </Transition>
        </Box>
    );
};

export default NewProject;
