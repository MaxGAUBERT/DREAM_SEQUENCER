import { useContext, createContext, useRef, useState, useMemo, useEffect } from "react";
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
    
    // ✅ Créer le sampler une seule fois avec useMemo
    const metronomeSampler = useMemo(() => {
        return new Tone.Sampler({
            urls: { C4: "metronome.mp3" }, 
            baseUrl: "/Audio/", 
            onload: () => console.log("Metronome loaded")
        }).toDestination();
    }, []);

    // ✅ Utiliser useEffect pour éviter les side effects dans le render
    useEffect(() => {
        Tone.Transport.bpm.value = bpm;
    }, [bpm]);

    // ✅ Mémoriser la valeur du contexte pour éviter les re-renders inutiles
    const contextValue = useMemo(() => ({
        playMode,
        setPlayMode,
        sequencesRef,
        isPlaying,
        setIsPlaying,
        bpm,
        setBpm,
        volume,
        setVolume,
        metronome,
        setMetronome,
        metronomeSampler,
        // Pas besoin de setMetronomeSampler car le sampler est maintenant statique
    }), [
        playMode,
        isPlaying,
        bpm,
        volume,
        metronome,
        metronomeSampler
    ]);

    return (
        <CreatePlayContext.Provider value={contextValue}>
            {children}
        </CreatePlayContext.Provider>
    );
};

export default PlayContext;