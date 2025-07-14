import { createContext, useContext, useRef } from "react";
import * as Tone from "tone";
import { useSynth } from "../Hooks/useSynth";
// Création du contexte
const SampleContext = createContext(null);

// Hook pour y accéder facilement
export const useSampleContext = () => useContext(SampleContext);

// Provider
export const ChannelProvider = ({ children }) => {
  const samplersRef = useRef({}); 
  const synthRef = useRef({});
  const {state} = useSynth();

  const loadSample = async (instrumentName, sampleUrl) => {
    if (!sampleUrl || samplersRef.current[instrumentName]) console.log(`Error for ${instrumentName}`);

    const sampler = new Tone.Sampler({
      urls: { C4: sampleUrl },
      onload: () => {
        console.log(`Sampler loaded for ${instrumentName}`);
      }
    }).toDestination();

    samplersRef.current[instrumentName] = sampler;
  };

  const createSynth = async (instrumentName, state) => {

    switch (state.synthType) {
      case "Synth": 
        synthRef.current[instrumentName] = new Tone.Synth().toDestination();
        break;
      case "FMSynth":
        synthRef.current[instrumentName] = new Tone.FMSynth().toDestination();
        break;
      case "AMSynth":
        synthRef.current[instrumentName] = new Tone.AMSynth().toDestination();
        break;
      case "DuoSynth":
        synthRef.current[instrumentName] = new Tone.DuoSynth().toDestination();
        break;
      case "MonoSynth":
        synthRef.current[instrumentName] = new Tone.MonoSynth().toDestination();
        break;
      case "MembraneSynth":
        synthRef.current[instrumentName] = new Tone.MembraneSynth().toDestination();
        break;
      default:
        break;
    }

    console.log(`Synth ${state.synthType} created for ${instrumentName}`);

    
};



  const getSampler = (instrumentName) => {
    console.log(samplersRef);
    return samplersRef?.current[instrumentName] || null;
  };

  const getSynth = (instrumentName) => {
    console.log(synthRef);
    return synthRef?.current[instrumentName] || null;
  };

  const contextValue = {
    loadSample,
    getSampler,
    createSynth,
    getSynth
  };

  return (
    <SampleContext.Provider value={contextValue}>
      {children}
    </SampleContext.Provider>
  );
};

export default ChannelProvider;