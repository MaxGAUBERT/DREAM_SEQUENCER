import { createContext, useContext, useRef } from "react";
import * as Tone from "tone";

// Création du contexte
const SampleContext = createContext(null);

// Hook pour y accéder facilement
export const useSampleContext = () => useContext(SampleContext);

// Provider
export const ChannelProvider = ({ children }) => {
  const samplersRef = useRef({}); 

   const loadSample = (instrumentName, sampleUrl) => {
    if (!instrumentName || !sampleUrl) {
      return Promise.reject(new Error("loadSample: bad arguments"));
    }
    // Remplace proprement l'ancien sampler s'il existe
    const old = samplersRef.current[instrumentName];
    if (old) {
      try { old.dispose(); } catch {}
      samplersRef.current[instrumentName] = undefined;
    }

    return new Promise((resolve) => {
      const sampler = new Tone.Sampler({
        urls: { C4: sampleUrl },
        onload: () => {
          samplersRef.current[instrumentName] = sampler;
          console.log(`Sampler loaded for ${instrumentName}`);
          resolve(sampler);
        },
      }).toDestination();
    });
  };

  const getSampler = (instrumentName) =>
    samplersRef.current?.[instrumentName] || null;


  const contextValue = {
    loadSample,
    getSampler
  };

  return (
    <SampleContext.Provider value={contextValue}>
      {children}
    </SampleContext.Provider>
  );
};

export default ChannelProvider;