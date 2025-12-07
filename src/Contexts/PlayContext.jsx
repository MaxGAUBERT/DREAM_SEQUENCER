import { useContext, createContext, useRef, useState, useMemo, useEffect } from "react";
import * as Tone from "tone";
import { useSettings } from "./SettingsContexts";

const CreatePlayContext = createContext(null);
export const usePlayContext = () => useContext(CreatePlayContext);

const PlayContext = ({ children }) => {
    const { settings } = useSettings();   // ✅ hook appelé dans le composant

    const sequencesRef = useRef([]);
    const [playMode, setPlayMode] = useState("Song");
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(settings.bpm ?? 130);  // valeur initiale = settings

    const [volume, setVolume] = useState(0);
    const [metronome, setMetronome] = useState(false);

    // Charger le sampler une seule fois
    const metronomeSampler = useMemo(() => {
        return new Tone.Sampler({
            urls: { C4: "metronome.mp3" },
            baseUrl: "/Audio/",
            onload: () => console.log("Metronome loaded")
        }).toDestination();
    }, []);

    // 🚀 Synchroniser le BPM local avec les Settings — auto quand user change le BPM dans Settings
    useEffect(() => {
        if (settings?.bpm !== undefined) {
            setBpm(settings.bpm);
        }
    }, [settings.bpm]);

    // 🚀 Appliquer le BPM au moteur audio Tone.js
    useEffect(() => {
        Tone.Transport.bpm.value = bpm;
    }, [bpm]);

    // Contexte mémoïsé
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
