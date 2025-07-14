// useDrumRackHandlers.js
import { useCallback } from "react";
import * as Tone from "tone";
import { useProjectManager } from "./useProjectManager";
import { useSampleContext } from "../Contexts/ChannelProvider";

export default function useDrumRackHandlers({
  instrumentName,
  setInstrumentName,
  setInstrumentList,
  instrumentList,
  numSteps,
  selectedPatternID
}) {
  const { assignSampleToInstrument } = useProjectManager();
  const {getSampler, loadSample} = useSampleContext();

  const toggleStep = useCallback((name, index) => {
    setInstrumentList((prev) => {
      const inst = prev[name];
      const pattern = inst.grids?.[selectedPatternID] || Array(numSteps).fill(false);
      const newPattern = [...pattern];
      newPattern[index] = !newPattern[index];
      return {
        ...prev,
        [name]: {
          ...inst,
          grids: {
            ...inst.grids,
            [selectedPatternID]: newPattern,
          },
        },
      };
    });
  }, [numSteps, selectedPatternID]);

  const handleMute = useCallback((name, muted) => {
    setInstrumentList((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        muted,
      },
    }));
  }, []);

  const handleSlotChange = useCallback((name, slot) => {
    setInstrumentList((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        slot,
      },
    }));
  }, []);

  const handleSampleLoad = useCallback((name, e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("audio/")) return;

  const url = URL.createObjectURL(file);
  const cleanName = file.name.replace(/\.[^/.]+$/, "");
   
  const sample = {
    name: cleanName,
    urls: { C4: url },
  };

  loadSample(name, url);
   // Mettre à jour l'état avec le sampler chargé
  setInstrumentList((prev) => ({
    ...prev,
    [name]: {
      ...prev[name],
      sampler: getSampler(name),
      sample,
      sampleUrl: url,
    },
  }));

  // Important : remettre input à zéro pour recharger un fichier identique plus tard
  e.target.value = "";
}, [assignSampleToInstrument, setInstrumentList]);


  const handleDeleteInstrument = useCallback((name) => {
    setInstrumentList((prev) => {
      const newList = { ...prev };
      delete newList[name];
      return newList;
    });
  }, []);

  const handleReset = useCallback(() => {
    setInstrumentList((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((name) => {
        if (updated[name].grids?.[selectedPatternID]) {
          updated[name].grids[selectedPatternID] = Array(numSteps).fill(false);
        }
      });
      return updated;
    });
  }, [selectedPatternID, numSteps]);

  const handleDeleteAll = useCallback(() => {
    setInstrumentList({});
  }, []);

  const handleRename = useCallback((newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === instrumentName || instrumentList[trimmed]) return;
    setInstrumentList((prev) => {
      const entries = Object.entries(prev).map(([key, val]) =>
        key === instrumentName ? [trimmed, val] : [key, val]
      );
      return Object.fromEntries(entries);
    });
    setInstrumentName(trimmed);
  }, [instrumentName, instrumentList]);

  const handleAddInstrument = useCallback((e) => {
  e?.preventDefault?.();
  const trimmedName = instrumentName.trim();
  if (!trimmedName) return;

  setInstrumentList((prev) => {
    const patternIds = Object.keys(prev)[0]
      ? Object.keys(Object.values(prev)[0].grids || {})
      : [selectedPatternID];

    const newInstrument = {
      value: null,
      grids: Object.fromEntries(
        patternIds.map((id) => [id, Array(numSteps).fill(false)])
      ),
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

    return {
      ...prev,
      [trimmedName]: newInstrument
    };
  });

  setInstrumentName("");
}, [instrumentName, selectedPatternID, numSteps]);


  const handleSelectSample = useCallback((sample, name) => {
    const url = sample.url;

    // Assigne dans instrumentList
    assignSampleToInstrument(name, sample);

    // Charge réellement le sample (dans Tone)
    loadSample(name, url); // ou true si besoin

    // Met à jour instrumentList avec sampler visible localement (optionnel mais pas requis ici)
    setInstrumentList((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        sampler: getSampler(name),
        sample,
        sampleUrl: url,
      },
    }));
}, [instrumentList, assignSampleToInstrument, loadSample, getSampler]);

  return {
    toggleStep,
    onMute: handleMute,
    onSlotChange: handleSlotChange,
    onSampleLoad: handleSampleLoad,
    onDeleteInstrument: handleDeleteInstrument,
    onReset: handleReset,
    onDeleteAll: handleDeleteAll,
    onRename: handleRename,
    onAddInstrument: handleAddInstrument,
    onSelectSample: handleSelectSample
  };
}
