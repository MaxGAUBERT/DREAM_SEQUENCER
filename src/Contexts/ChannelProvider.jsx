import { createContext, useContext, useRef } from "react";
import * as Tone from "tone";

const SampleContext = createContext(null);
export const useSampleContext = () => useContext(SampleContext);

export const ChannelProvider = ({ children }) => {
  const samplersRef = useRef({});

  // Charger un nouveau sampler
  const loadSample = (instrumentName, sampleUrl) => {
    if (!instrumentName || !sampleUrl) {
      return Promise.reject(new Error("loadSample: bad arguments"));
    }

    // Détruire l'ancien sampler
    const old = samplersRef.current[instrumentName];
    if (old) {
      try { old.dispose(); } catch {}
    }

    samplersRef.current[instrumentName] = null;

    return new Promise((resolve) => {
      const sampler = new Tone.Sampler({
        urls: { C4: sampleUrl },
        onload: () => {
          samplersRef.current[instrumentName] = sampler;
          console.log(`🎵 Sampler loaded for ${instrumentName}`);
          resolve(sampler);
        },
      }).toDestination();
    });
  };

  // Détruire explicitement un sampler
  const unloadSample = (instrumentName) => {
    const old = samplersRef.current[instrumentName];
    if (old) {
      try { old.dispose(); } catch {}
    }
    samplersRef.current[instrumentName] = null;
    console.log(`🗑 Sampler unloaded for ${instrumentName}`);
  };

  // Récupérer un sampler
  const getSampler = (instrumentName) => {
    return samplersRef.current[instrumentName] || null;
  };

  return (
    <SampleContext.Provider value={{ loadSample, unloadSample, getSampler }}>
      {children}
    </SampleContext.Provider>
  );
};

export default ChannelProvider;
