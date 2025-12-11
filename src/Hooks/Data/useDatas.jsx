import { useState } from "react";
import * as Tone from 'tone';
import { useSettings } from "../../Contexts/SettingsContexts";
import { useCallback } from "react";
import usePatternManager from "../Patterns/usePatternManager";

export function useDatas(){

    const { settings } = useSettings();
    const {initLength, selectedPatternID} = usePatternManager();
    const [width, setWidth] = useState(20); 
    const [height, setHeight] = useState(50); 
    const [numSteps, setNumSteps] = useState(64);
    const CELL_SIZE = 100;
    const [cells, setCells] = useState(Array(width * height).fill(0));
    const [currentProjectId, setCurrentProjectId] = useState(0);
  

    const DEFAULT_INSTRUMENTS = Array.from({ length: settings.channels }, (_, i) => {
        const DEFAULTS = ["Kick", "Snare", "HiHat", "Clap"];
        return DEFAULTS[i] || `Channel ${i + 1}`;
    });

    const DEFAULT_SAMPLES = {
      Kick: "/Audio/Drums/Progressive_Kick.wav",
      Snare: "/Audio/Drums/VEC1_Snare_025.wav",
      HiHat: "/Audio/Drums/VEC4_Closed_HH_018.wav",
      Clap: "/Audio/Drums/VEH3_Claps_011.wav",
    };
 const initializeInstrumentList = useCallback(() => {
        return Object.fromEntries(
          DEFAULT_INSTRUMENTS.map((inst, idx) => {
            const defaultSampleUrl = DEFAULT_SAMPLES[inst] ?? null;
    
            const sampler = defaultSampleUrl
              ? new Tone.Sampler({
                  urls: { C4: defaultSampleUrl },
                  onload: () => console.log(`Sample chargé: ${inst}`)
                }).toDestination()
              : null;
    
            return [
              inst,
              {
                grids: Object.fromEntries(
                  Array.from({ length: initLength }, (_, i) => [
                    i,
                    Array(16).fill(false)
                  ])
                ),
    
                pianoData: {
                  [selectedPatternID]: []
                },
    
                volume: 5,
                fx: null,
                muted: false,
    
                sample: {
                  id: null,
                  url: defaultSampleUrl,  
                  urls: defaultSampleUrl ? { C4: defaultSampleUrl } : {},
                  name: inst,
                },
    
                sampleUrl: defaultSampleUrl, 
                fileName: defaultSampleUrl ? defaultSampleUrl.split("/").pop() : null,
                sampler,
                slot: idx + 1,
              }
            ];
          })
        );
    }, [initLength, selectedPatternID]);
      
    const [instrumentList, setInstrumentList] = useState(initializeInstrumentList);

    return {
        numSteps, setNumSteps,
        CELL_SIZE,
        initLength, selectedPatternID,
        cells, setCells,
        width, setWidth,
        height, setHeight,
        currentProjectId, setCurrentProjectId,
        DEFAULT_INSTRUMENTS, initializeInstrumentList,
        instrumentList, setInstrumentList
    }

}

export default useDatas;