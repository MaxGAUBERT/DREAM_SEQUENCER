import { useState, useEffect, useCallback } from "react";
import { stringify, parse } from "flatted";
function getColorByIndex(i) {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-pink-500", "bg-purple-500", "bg-orange-500", "bg-teal-500",
  ];
  return colors[i % colors.length];
}

export function useProjectManager() {
  const initLength = 8;
  const INITIAL_PATTERN_ID = 0;
  const [numSteps, setNumSteps] = useState(16);
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [patterns, setPatterns] = useState([{
    id: 1,
    name: "Pattern 1",
    color: getColorByIndex(0),
    grid: Array(numSteps).fill(false),
  }]);
  const [selectedPatternID, setSelectedPatternID] = useState(INITIAL_PATTERN_ID);

  const DEFAULT_INSTRUMENTS = ["Kick", "Snare", "HiHat", "Clap"];

   // Initialiser avec toutes les grilles pour tous les patterns initiaux
  const initializeInstrumentList = useCallback(() => {
    return Object.fromEntries(
      DEFAULT_INSTRUMENTS.map(inst => [
        inst,
        {
          grids: Object.fromEntries(
            Array.from({ length: initLength }, (_, i) => [i, Array(16).fill(false)])
          ),
          value: null,
          checked: false
        }
      ])
    );
  }, [initLength]);

  const [instrumentList, setInstrumentList] = useState(initializeInstrumentList);

  // Chargement initial depuis localStorage
  
  useEffect(() => {
    const saved = localStorage.getItem("projects");
    if (saved) {
      try {
        const parsed = parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
          const firstProject = parsed[0];
          loadProject(firstProject.id, parsed); // préchargement
        }
      } catch (e) {
        console.error("Erreur de chargement des projets :", e);
      }
    }
  }, []);
  

  const saveToLocalStorage = (updatedProjects) => {
    localStorage.setItem("projects", stringify(updatedProjects));
  };

  const createProject = () => {
    const newId = Math.max(0, ...projects.map(p => p.id)) + 1;
    const newPatterns = Array.from({ length: initLength }, (_, i) => ({
      id: i,
      name: `Pattern ${i + 1}`,
      color: getColorByIndex(i),
      grid: Array(numSteps).fill(false),
    }));
    const newProject = {
      id: newId,
      name: "New Project",
      patterns: newPatterns,
      instrumentList: {
        Kick: { grids: {} },
        Snare: { grids: {} },
        HiHat: { grids: {} },
        Clap: { grids: {} },
      },
      numSteps,
      selectedPatternID: newPatterns.length - 1,
      createdAt: new Date().toISOString()
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    saveToLocalStorage(updated);
    loadProject(newId, updated);
  };

  const saveCurrentProject = () => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          patterns,
          instrumentList,
          numSteps,
          selectedPatternID,
          lastSaved: new Date().toISOString()
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    saveToLocalStorage(updatedProjects);
  };

  const saveAsProject = (name) => {
    const newId = Math.max(0, ...projects.map(p => p.id)) + 1;
    const newProject = {
      id: newId,
      name,
      patterns,
      instrumentList,
      numSteps,
      selectedPatternID,
      createdAt: new Date().toISOString()
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    setCurrentProjectId(newId);
    saveToLocalStorage(updated);
  };

  const loadProject = (projectId, fromProjects = projects) => {
    const project = fromProjects.find(p => p.id === projectId);
    if (!project) return;

    setCurrentProjectId(projectId);
    setPatterns(project.patterns || []);
    setInstrumentList(project.instrumentList || {});
    setNumSteps(project.numSteps || 16);
    setSelectedPatternID(
      typeof project.selectedPatternID === "number" ? project.selectedPatternID : 0
    );
  };

  return {
    projects,
    instrumentList,
    setInstrumentList,
    initializeInstrumentList,
    currentProjectId,
    currentProject: projects.find(p => p.id === currentProjectId),
    initLength,
    INITIAL_PATTERN_ID,
    patterns,
    setPatterns,
    numSteps,
    setNumSteps,
    selectedPatternID,
    setSelectedPatternID,
    createProject,
    saveCurrentProject,
    saveAsProject,
    loadProject
  };
}
