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
  const [currentProjectId, setCurrentProjectId] = useState(0);
  const [patterns, setPatterns] = useState([{
    id: 1,
    name: "Pattern 1",
    color: getColorByIndex(0),
    grid: Array(16).fill(false),
  }]);
  const [selectedPatternID, setSelectedPatternID] = useState(INITIAL_PATTERN_ID);
  const [notes, setNotes] = useState([]);

  const DEFAULT_INSTRUMENTS = ["Kick", "Snare", "HiHat", "Clap"];
  const initializeInstrumentList = useCallback(() => {
    return Object.fromEntries(
      DEFAULT_INSTRUMENTS.map(inst => [
        inst,
        {
          grids: Object.fromEntries(
            Array.from({ length: initLength }, (_, i) => [i, Array(16).fill(false)])
          ),
          value: null,
          sample:{
            id: null,
            url: null,
            name: null
          }
        }
      ])
    );
  }, [initLength]);

  const [instrumentList, setInstrumentList] = useState(initializeInstrumentList);
  
  useEffect(() => {
  const saved = localStorage.getItem("projects");
  if (saved) {
    try {
      const parsed = parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProjects(parsed);
      }
    } catch (e) {
      console.error("Erreur de chargement des projets :", e);
    }
  }
}, []);

const assignSampleToInstrument = (instrumentName, sample) => {
  setInstrumentList(prev => ({
    ...prev,
    [instrumentName]: {
      ...prev[instrumentName],
      sample: {
        id: sample.id,
        url: sample.url,
        name: sample.name
      }
    }
  }));
};



  const saveToLocalStorage = (updatedProjects) => {
    localStorage.setItem("projects", stringify(updatedProjects));
  };
  
  const createProject = () => {
  const newId = Math.max(0, ...projects.map(p => p.id)) + 1;

  const newPatterns = Array.from({ length: initLength }, (_, i) => ({
    id: i,
    name: `Pattern ${i + 1}`,
    color: getColorByIndex(i),
    grid: Array(16).fill(false),
  }));

  const newInstrumentList = initializeInstrumentList();

  const newProject = {
    id: newId,
    name: "New Project",
    patterns: newPatterns,
    instrumentList: newInstrumentList,
    notes,
    numSteps: 16,
    selectedPatternID: newPatterns.length - 1,
    createdAt: new Date().toISOString()
  };

  const updated = [...projects, newProject];
  setProjects(updated);
  saveToLocalStorage(updated);

  // Charger le projet via la même méthode que celle utilisée ailleurs
  loadProject(newId, updated);
};


  const saveCurrentProject = () => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          patterns,
          instrumentList,
          notes,
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
      notes,
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
    notes,
    setNotes,
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
    loadProject,
    assignSampleToInstrument,
    deleteAllProjects: () => setProjects([]),
  };
}
