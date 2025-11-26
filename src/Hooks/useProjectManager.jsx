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
    // Mémoiser openComponents pour éviter les re-renders
  const [openComponents, setOpenComponents] = useState(() => ({
    "Drum Rack": true,
    "Pattern Selector": true,
    "Piano Roll": true,
    "Playlist": true,
    "FXChain": true
  }));

  const INITIAL_PATTERN_ID = 0;
  const [width, setWidth] = useState(20); 
  const [height, setHeight] = useState(50); 
  const CELL_SIZE = 100;
  const [cells, setCells] = useState(Array(width * height).fill(0));
  const [numSteps, setNumSteps] = useState(64);
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(0);
  const [selectedSoundId, setSelectedSoundId] = useState("");
  const {
    audioObjects,
    setAudioObjects
  } = useSoundBank();

  const initLength = 8;

  const [patterns, setPatterns] = useState(() =>
    Array.from({ length: initLength }, (_, i) => ({
      id: i, 
      name: `Pattern ${i + 1}`,
      color: getColorByIndex(i),
      grid: Array(16).fill(false), 
      pianoData: []              
    }))
  );


  const [selectedPatternID, setSelectedPatternID] = useState(INITIAL_PATTERN_ID);
  
  const DEFAULT_INSTRUMENTS = ["Kick", "Snare", "HiHat", "Clap"];

  const DEFAULT_SAMPLES = {
    Kick: "/Audio/Drums/Progressive_Kick.wav",
    Snare: "./Audio/Drums/VEC1_Snare_025.wav",
    HiHat: "./Audio/Drums/VEC4_Closed_HH_018.wav",
    Clap: "./Audio/Drums/VEH3_Claps_011.wav",
  };

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

const initializeInstrumentList = useCallback(() => {
  return Object.fromEntries(
    DEFAULT_INSTRUMENTS.map((inst, idx) => [
      inst,
      {
        grids: Object.fromEntries(
          Array.from({ length: initLength }, (_, i) => [i, Array(16).fill(false)])
        ),
        pianoData: {
          [selectedPatternID]: []
        },
        volume: 5,
        fx: null,
        muted: false,
        sample: {
          id: null,
          urls: { C4: DEFAULT_SAMPLES[inst] ?? null }, // assignation par défaut
          name: inst,
        },
        sampler: DEFAULT_SAMPLES[inst],
        sampleUrl: DEFAULT_SAMPLES[inst] ?? null,
        fileName: DEFAULT_SAMPLES[inst]
          ? DEFAULT_SAMPLES[inst].split("/").pop()
          : null,
        slot: idx + 1,
      }
    ])
  );
}, [initLength, selectedPatternID]);

const [instrumentList, setInstrumentList] = useState(initializeInstrumentList);


  const applyInstrumentChange = useCallback((updateFn) => {
    setInstrumentList((prev) => {
        const updated = updateFn(prev);
        return updated;
    });
  }, []);

  const getInstrumentListSnapshot = useCallback(() => {
  return structuredClone(instrumentList);
  }, [instrumentList]);

  const updateInstrumentSlot = useCallback((channelId, newSlot) => {
    setInstrumentList(prev => {
      if (!prev[channelId]) {
        return prev;
      }

      const updated = {
        ...prev,
        [channelId]: {
            ...prev[channelId], slot: Number(newSlot),
        },
      }
      return updated;
    });
  }, [instrumentList])

  const assignSampleToInstrument = useCallback((instrumentName, sample) => {
    setInstrumentList(prev => ({
      ...prev,
      [instrumentName]: {
        ...prev[instrumentName],
        sample: {
          id: sample.id,
          urls: { C4: sample.url },
          name: sample.name
        }, 
        sampler: null,
        sampleUrl: sample.urls
      }
    }));
  }, []);

  const saveToLocalStorage = (updatedProjects) => {
    localStorage.setItem("projects", stringify(updatedProjects));
  };

  // Manage project (localstorage)

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
      createdAt: new Date().toISOString(),
      cells: Array(width * height).fill(0), 
      width,
      height
    };

    const updated = [...projects, newProject];
    setCells(Array(width * height).fill(0));
    setProjects(updated);
    setCurrentProjectId(newId);
    saveToLocalStorage(updated);
    loadProject(newId, updated);

    setOpenComponents({
      "Drum Rack": true,
      "Pattern Selector": true,
      "Piano Roll": true,
      "Playlist": true,
      "FXChain": true
    });

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
          lastSaved: new Date().toISOString(),
          cells, 
          openComponents,
          width, 
          height
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
    createdAt: new Date().toISOString(),
    cells, 
    openComponents, 
    width, 
    height
  };

  const updated = [...projects, newProject];
  setProjects(updated);
  setCurrentProjectId(newId);

  // ✅ Sauvegarde explicite pour le projet cloné
  localStorage.setItem(
    `project_${newId}_instruments`,
    stringify(instrumentList)
  );

  saveToLocalStorage(updated);
  console.log("Project saved as:", updated);
};

const loadProject = async (projectId, fromProjects = projects) => {
  const project = fromProjects.find(p => p.id === projectId);
  if (!project) return;

  console.log("Chargement du projet:", project);

   // ✅ Restaurer width/height avec fallback sur l’état courant
  const newWidth = typeof project.width === 'number' ? project.width : width;
  const newHeight = typeof project.height === 'number' ? project.height : height;
  const needed = newWidth * newHeight;

  // ✅ Ajuster cells à la nouvelle surface
  const loadedCells = Array.isArray(project.cells) ? project.cells : [];
  const nextCells =
    loadedCells.length === needed
      ? loadedCells
      : loadedCells.length < needed
        ? [...loadedCells, ...Array(needed - loadedCells.length).fill(0)]
        : loadedCells.slice(0, needed);

  setWidth(newWidth);
  setHeight(newHeight);
  setCells(nextCells);

  setCurrentProjectId(projectId);
  setPatterns(project.patterns || []);

  const loadedInstrumentList = project.instrumentList || {};

  const instrumentEntries = await Promise.all(
    Object.entries(loadedInstrumentList).map(async ([name, data]) => {
      const sampleUrl = data.sample?.url || data.sampleUrl;
      
      return [
        name,
        {
          ...data,
          sampler: instrumentList[name]?.sampler,
          sampleUrl,
          fileName: data.sample?.name || data.fileName,
        }
      ];
    })
    
  );

  const normalizedInstrumentList = Object.fromEntries(instrumentEntries);

  setInstrumentList(normalizedInstrumentList);
  setSelectedSoundId(project.selectedSoundId || "acoustic_kick");
  setNumSteps(project.numSteps || 16);
  setSelectedPatternID(
    typeof project.selectedPatternID === "number" ? project.selectedPatternID : 0
  );
  setNotes(project.notes || []);

  setOpenComponents(project.openComponents || {
  "Drum Rack": true,
  "Pattern Selector": true,
  "Piano Roll": true,
  "Playlist": true,
  "FXChain": true
});


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
    // project management
    createProject,
    saveCurrentProject,
    saveAsProject,
    loadProject,
    deleteProject,
    currentProject: projects.find(p => p.id === currentProjectId),
    deleteAllProjects: () => {
      setProjects([]);
      localStorage.removeItem("projects");
    },
    // project data
    numSteps,
    setNumSteps,
    cells, setCells,
    CELL_SIZE, width, height, setWidth, setHeight,
    currentProjectId,
    projects,
    instrumentList,
    setInstrumentList,
    initializeInstrumentList,
    DEFAULT_INSTRUMENTS,
    // functions for instruments
    assignSampleToInstrument,
    applyInstrumentChange,
    getInstrumentListSnapshot,
    updateInstrumentSlot,
    // patterns management
    initLength,
    patterns,
    setPatterns,
    selectedPatternID,
    setSelectedPatternID,
    // state of project windows
    openComponents, setOpenComponents
  };
}