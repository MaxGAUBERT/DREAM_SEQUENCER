// useDrumRackHandlers.js
import { useCallback, useEffect } from "react";
import { useProjectManager } from "./useProjectManager";
import { useSampleContext } from "../Contexts/ChannelProvider";
import { useHistoryContext } from "../Contexts/HistoryProvider";
import useFXChain from "./useFXChain";

export default function useDrumRackHandlers({
  instrumentName,
  setInstrumentName,
  setInstrumentList,
  instrumentList,
  numSteps,
  selectedPatternID
}) {
  const { assignSampleToInstrument, initializeInstrumentList } = useProjectManager();
  const { getSampler, loadSample } = useSampleContext();
  const { addAction, undo, redo, canUndo, canRedo } = useHistoryContext();
  const { setSelectedSlot, selectedSlot} = useFXChain();

  useEffect(() => {
    console.log("SelectedSlot updated:", selectedSlot);
  }, [selectedSlot]);

  const toggleStep = useCallback((name, index) => {
    const inst = instrumentList[name];
    const pattern = inst.grids?.[selectedPatternID] ?? Array(numSteps).fill(false);
    const prevValue = pattern[index];
    const nextValue = !prevValue;

    // Créer l'action avec les fonctions apply et revert
    const action = {
      type: "toggleStep",
      payload: {
        name,
        index,
        selectedPatternID,
        prevValue,
        nextValue,
        numSteps
      },
      apply: () => {
        if (selectedPatternID === null) return;
        setInstrumentList(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            grids: {
              ...prev[name].grids,
              [selectedPatternID]: prev[name].grids[selectedPatternID].map((step, i) =>
                i === index ? nextValue : step
              )
            }
          }
        }));
      },
      revert: () => {
        setInstrumentList(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            grids: {
              ...prev[name].grids,
              [selectedPatternID]: prev[name].grids[selectedPatternID].map((step, i) =>
                i === index ? prevValue : step
              )
            }
          }
        }));
      }
    };

    // Appliquer immédiatement et ajouter à l'historique
    action.apply();
    addAction(action);
  }, [addAction, selectedPatternID, numSteps, setInstrumentList, instrumentList]);

  const handleMute = useCallback((name, muted) => {
    const prevMuted = instrumentList[name]?.muted;
    
    const action = {
      type: "muteInstrument",
      payload: { name, muted, prevMuted },
      apply: () => {
        setInstrumentList(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            muted
          }
        }));
      },
      revert: () => {
        setInstrumentList(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            muted: prevMuted
          }
        }));
      }
    };

    action.apply();
    addAction(action);
  }, [setInstrumentList, instrumentList, addAction]);

  const handleSlotChange = useCallback((name, slot) => {
  const prevSlot = instrumentList[name]?.slot;

  if (prevSlot === slot) return;

  const action = {
    type: "changeSlot",
    payload: { name, slot, prevSlot },
    apply: () => {
      console.log(`Assign slot ${slot} to instrument "${name}"`);

      setInstrumentList(prev => ({
        ...prev,
        [name]: {
          ...prev[name],
          slot: Number(slot)
        }
      }));

      // ✅ mettre selectedSlot à jour **après** instrumentList
      if (selectedSlot.channel === name) {
        setSelectedSlot({ channel: name, slot: Number(slot) });
      }
    },
    revert: () => {
      setInstrumentList(prev => ({
        ...prev,
        [name]: {
          ...prev[name],
          slot: prevSlot
        }
      }));

      if (selectedSlot.channel === name) {
        setSelectedSlot({ channel: name, slot: prevSlot });
      }
    }
  };

  action.apply();
  addAction(action);
}, [setInstrumentList, instrumentList, setSelectedSlot, selectedSlot, addAction]);


  const handleSampleLoad = useCallback((name, e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("audio/")) return;

    const url = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]$/, "");

    const sample = {
      name: cleanName,
      urls: { C4: url }
    };

    const prevState = { ...instrumentList[name] };

    const action = {
      type: "loadSample",
      payload: { name, sample, url, prevState },
      apply: () => {
        setInstrumentList(prev => ({
          ...prev,
          [name]: { ...prev[name], sample, sampleUrl: url }
        }));
        loadSample(name, url).then(() => {
          setInstrumentList(prev => ({
            ...prev,
            [name]: { ...prev[name], sampler: getSampler(name) }
          }));
        });
    },
      revert: () => {
        setInstrumentList(prev => ({
          ...prev,
          [name]: { ...prev[name], sample: prevState.sample, sampleUrl: prevState.sampleUrl }
        }));
      }
    };


    action.apply();
    addAction(action);
    e.target.value = "";
  }, [assignSampleToInstrument, setInstrumentList, loadSample, getSampler, instrumentList, addAction]);

  const handleDeleteInstrument = useCallback((name) => {
    const prevState = { ...instrumentList };
    
    const action = {
      type: "deleteInstrument",
      payload: { name, prevState },
      apply: () => {
        setInstrumentList(prev => {
          const newList = { ...prev };
          delete newList[name];
          return newList;
        });

        // Si l'instrument supprimé était sélectionné dans FXChain, réinitialiser la sélection
        if (selectedSlot.channel === name) {
          setSelectedSlot({ channel: null, slot: 0 });
        }
      },
      revert: () => {
        setInstrumentList(prevState);
      }
    };

    action.apply();
    addAction(action);
  }, [setInstrumentList, instrumentList, selectedSlot, setSelectedSlot, addAction]);

  const handleClear = useCallback(() => {
    const prevState = { ...instrumentList };
    
    const action = {
      type: "clearPattern",
      payload: { selectedPatternID, numSteps, prevState },
      apply: () => {
        setInstrumentList(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(name => {
            if (updated[name].grids?.[selectedPatternID]) {
              updated[name].grids[selectedPatternID] = Array(numSteps).fill(false);
            }
          });
          return updated;
        });
      },
      revert: () => {
        setInstrumentList(prevState);
      }
    };

    action.apply();
    addAction(action);
  }, [selectedPatternID, numSteps, setInstrumentList, instrumentList, addAction]);

  const handleDeleteAll = useCallback(() => {
    const prevState = { ...instrumentList };
    
    const action = {
      type: "deleteAll",
      payload: { prevState },
      apply: () => {
        setInstrumentList({});
        // Réinitialiser FXChain selection
        setSelectedSlot({ channel: null, slot: 0 });
      },
      revert: () => {
        setInstrumentList(prevState);
      }
    };

    action.apply();
    addAction(action);
  }, [setInstrumentList, instrumentList, setSelectedSlot, addAction]);

  const handleRename = useCallback((newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === instrumentName || instrumentList[trimmed]) return;

    const prevState = { ...instrumentList };
    const prevInstrumentName = instrumentName;
    
    const action = {
      type: "renameInstrument",
      payload: { oldName: instrumentName, newName: trimmed, prevState },
      apply: () => {
        setInstrumentList(prev => {
          const entries = Object.entries(prev).map(([key, val]) =>
            key === instrumentName ? [trimmed, val] : [key, val]
          );
          return Object.fromEntries(entries);
        });
        setInstrumentName(trimmed);

        // Mettre à jour FXChain si l'instrument renommé était sélectionné
        if (selectedSlot.channel === instrumentName) {
          setSelectedSlot({ ...selectedSlot, channel: trimmed });
        }
      },
      revert: () => {
        setInstrumentList(prevState);
        setInstrumentName(prevInstrumentName);

        // Restaurer le nom dans FXChain
        if (selectedSlot.channel === trimmed) {
          setSelectedSlot({ ...selectedSlot, channel: instrumentName });
        }
      }
    };

    action.apply();
    addAction(action);
  }, [instrumentName, instrumentList, setInstrumentList, setInstrumentName, selectedSlot, setSelectedSlot, addAction]);

  const handleReset = useCallback(() => {
  // snapshot pour UNDO (copie profonde)
  const prevState = structuredClone(instrumentList);

  // reconstruire la drum rack par défaut
  const defaultInstruments = initializeInstrumentList();

  const action = {
    type: "resetAllInstruments",
    payload: { prevState },

    apply: () => {
      setInstrumentList(structuredClone(defaultInstruments));
      setSelectedSlot({ channel: null, slot: 0 }); // reset FX chain
    },

    revert: () => {
      setInstrumentList(structuredClone(prevState));
      setSelectedSlot({ channel: null, slot: 0 });
    }
  };

  action.apply();
  addAction(action);

}, [
  instrumentList,
  setInstrumentList,
  addAction,
  setSelectedSlot
]);



  const handleAddInstrument = useCallback((e) => {
    e?.preventDefault?.();
    const trimmedName = instrumentName.trim();
    if (!trimmedName) return;

    const prevState = { ...instrumentList };
    const prevInstrumentName = instrumentName;

    const patternIds = Object.keys(instrumentList)[0]
      ? Object.keys(Object.values(instrumentList)[0].grids || {})
      : [selectedPatternID];

    const newInstrument = {
      value: null,
      grids: Object.fromEntries(patternIds.map(id => [id, Array(numSteps).fill(false)])),
      pianoData: {
        [selectedPatternID]: []
      },
      muted: false,
      sample: {
        id: null,
        urls: { C4: null },
        name: null
      },
      sampler: null,
      sampleUrl: null,
      fileName: null,
      slot: 0
    };

    const action = {
      type: "addInstrument",
      payload: { name: trimmedName, newInstrument, prevState },
      apply: () => {
        setInstrumentList(prev => ({
          ...prev,
          [trimmedName]: newInstrument
        }));
        setInstrumentName("");
      },
      revert: () => {
        setInstrumentList(prevState);
        setInstrumentName(prevInstrumentName);
      }
    };

    action.apply();
    addAction(action);
  }, [instrumentName, selectedPatternID, numSteps, setInstrumentList, setInstrumentName, instrumentList, addAction]);

  const handleSelectSample = useCallback((arg1, arg2, arg3) => {
   let name, url, displayName;
   if (typeof arg1 === "string") {
     // Nouveau style
     name = arg1; url = arg2; displayName = arg3;
   } else {
     // Ancien style (Channel Modal)
     const sampleObj = arg1 || {};
     name = arg2;
     url = sampleObj.url || sampleObj?.urls?.C4 || sampleObj.src;
     displayName = sampleObj.name;
   }
   if (!name || !url || !instrumentList[name]) return;

   const prevState = { ...instrumentList[name] };
   const cleanName = (displayName || (url.split("/").pop() || "sample")).replace(/\.[^/.]$/, "");
   const sample = { name: cleanName, urls: { C4: url } };

   const action = {
     type: "selectSample",
     payload: { name, sample, url, prevState },
     apply: () => {
       // 1) on écrit le nom/URL tout de suite
       setInstrumentList(prev => ({
         ...prev,
         [name]: { ...prev[name], sample, sampleUrl: url }
       }));
       // 2) on charge réellement l'audio puis on référence le sampler
       loadSample(name, url).then(() => {
         setInstrumentList(prev => ({
           ...prev,
           [name]: { ...prev[name], sampler: getSampler(name) }
         }));
       });
     },
     revert: () => {
       setInstrumentList(prev => ({ ...prev, [name]: prevState }));
     }
   };

   action.apply();
   addAction(action);
 }, [setInstrumentList, instrumentList, loadSample, getSampler, addAction]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  return {
    toggleStep,
    onMute: handleMute,
    onSlotChange: handleSlotChange,
    onSampleLoad: handleSampleLoad,
    onDeleteInstrument: handleDeleteInstrument,
    onClear: handleClear,
    onReset: handleReset,
    onDeleteAll: handleDeleteAll,
    onRename: handleRename,
    onAddInstrument: handleAddInstrument,
    onSelectSample: handleSelectSample,
    onUndo: handleUndo,
    onRedo: handleRedo,
    canUndo,
    canRedo
  };
}