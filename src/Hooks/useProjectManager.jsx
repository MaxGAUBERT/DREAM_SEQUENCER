import { useState, useEffect, useCallback, useRef } from "react";
import { stringify, parse } from "flatted";
import { useSoundBank } from "./useSoundBank";

function getColorByIndex(i) {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-pink-500", "bg-purple-500", "bg-orange-500", "bg-teal-500",
  ];
  return colors[i % colors.length];
}

export function useProjectManager() {
  const INITIAL_PATTERN_ID = 0;
  const [notes, setNotes] = useState([]);
  const [numSteps, setNumSteps] = useState(16);
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(0);
  const [selectedSoundId, setSelectedSoundId] = useState("acoustic_kick");
  const {
    audioObjects,
    setAudioObjects
  } = useSoundBank();
  const initLength = 8;
  const [patterns, setPatterns] = useState([{
    id: 1,
    name: "Pattern 1",
    color: getColorByIndex(0),
    grid: Array(16).fill(false),
    pianoData: []
  }]);
  const [selectedPatternID, setSelectedPatternID] = useState(INITIAL_PATTERN_ID);

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
          pianoData: {
            [selectedPatternID]: []
          },

          muted: false,
          sample: {
            id: null,
            urls: { C4: null },
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

  const assignSampleToInstrument = useCallback((instrumentName, sample) => {
    setInstrumentList(prev => ({
      ...prev,
      [instrumentName]: {
        ...prev[instrumentName],
        sample: {
          id: sample.id,
          urls: { C4: sample.url },
          name: sample.name
        }
      }
    }));
  }, []);

  const saveToLocalStorage = (updatedProjects) => {
    localStorage.setItem("projects", stringify(updatedProjects));
  };

  const createProject = (newName) => {
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
      name: newName,
      patterns: newPatterns,
      instrumentList: newInstrumentList,
      notes,
      numSteps: 16,
      selectedPatternID: newPatterns.length - 1,
      createdAt: new Date().toISOString()
    };

    const updated = [...projects, newProject];
    setProjects(updated);
    setCurrentProjectId(newId);
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
          selectedSoundId,
          audioObjects,
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
      selectedSoundId,
      audioObjects,
      notes,
      numSteps,
      selectedPatternID,
      createdAt: new Date().toISOString()
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    setCurrentProjectId(newId);
    saveToLocalStorage(updated);
    console.log("Project saved as:", updated);
  };

  const loadProject = (projectId, fromProjects = projects) => {
    const project = fromProjects.find(p => p.id === projectId);
    if (!project) return;

    console.log("Chargement du projet:", project);

    setCurrentProjectId(projectId);
    setPatterns(project.patterns || []);

    const loadedInstrumentList = project.instrumentList || {};
    const normalizedInstrumentList = Object.fromEntries(
      Object.entries(loadedInstrumentList).map(([name, data]) => [
        name,
        {
          ...data,
          sample: data.sample || {
            id: null,
            url: null,
            name: null
          },
          sampler: undefined,
          sampleUrl: data.sample?.url || data.sampleUrl,
          fileName: data.sample?.name || data.fileName
        }
      ])
    );

    setInstrumentList(normalizedInstrumentList);
    setSelectedSoundId(project.selectedSoundId || "acoustic_kick");
    setNumSteps(project.numSteps || 16);
    setSelectedPatternID(
      typeof project.selectedPatternID === "number" ? project.selectedPatternID : 0
    );
    setNotes(project.notes || []);
    console.log("Projet chargé avec instrumentList:", normalizedInstrumentList);
  };

  const deleteProject = (projectId) => {
    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);
    saveToLocalStorage(updated);

    if (currentProjectId === projectId && updated.length > 0) {
      loadProject(updated[0].id, updated);
    } else if (updated.length === 0) {
      setCurrentProjectId(0);
      setInstrumentList(initializeInstrumentList());
      setPatterns([{
        id: 1,
        name: "Pattern 1",
        color: getColorByIndex(0),
        grid: Array(16).fill(false),
      }]);
      setSelectedPatternID(0);
    }
  };

  return {
    projects,
    instrumentList,
    setInstrumentList,
    initializeInstrumentList,
    DEFAULT_INSTRUMENTS,
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
    deleteProject,
    assignSampleToInstrument,
    selectedSoundId,
    setSelectedSoundId,
    deleteAllProjects: () => {
      setProjects([]);
      localStorage.removeItem("projects");
    },
  };
}
