import { createContext, useContext, useRef } from "react";
import * as Tone from "tone";

// Création du contexte
const SampleContext = createContext(null);

// Hook pour y accéder facilement
export const useSampleContext = () => useContext(SampleContext);

// Provider
export const SampleProvider = ({ children }) => {
  const samplersRef = useRef({}); // Contiendra : { instrumentName: Tone.Sampler }

  const loadSample = async (instrumentName, sampleUrl) => {
    if (!sampleUrl || samplersRef.current[instrumentName]) return;

    const sampler = new Tone.Sampler({
      urls: { C4: sampleUrl },
      onload: () => {
        console.log(`Sampler loaded for ${instrumentName}`);
      }
    }).toDestination();

    samplersRef.current[instrumentName] = sampler;
  };

  const getSampler = (instrumentName) => {
    return samplersRef.current[instrumentName] || null;
  };

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

export default SampleProvider;