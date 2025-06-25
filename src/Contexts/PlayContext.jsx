import { useContext, createContext, useRef, useState } from "react";
import * as Tone from "tone";

const CreatePlayContext = createContext(null);
export const usePlayContext = () => useContext(CreatePlayContext);


const PlayContext = ({ children }) => {
    const sequencesRef = useRef([]);
    const [playMode, setPlayMode] = useState("Song");
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(140);
    const [volume, setVolume] = useState(0);
    const [metronome, setMetronome] = useState(false);
    const [metronomeSampler, setMetronomeSampler] = useState(
      new Tone.Sampler({
        urls: { C4: "metronome.mp3" }, 
        baseUrl: "/Audio/", 
        onload: () => console.log("Metronome loaded")
      }).toDestination()
    );

    Tone.Transport.bpm.value = bpm;

    return (
        <CreatePlayContext.Provider value={{ playMode, setPlayMode, sequencesRef, isPlaying, setIsPlaying, bpm, setBpm, volume, setVolume, metronome, setMetronome, metronomeSampler, setMetronomeSampler}}>
            {children}
        </CreatePlayContext.Provider>
    );
};

export default PlayContext;
