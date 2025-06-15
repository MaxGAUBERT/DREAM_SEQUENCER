import { useContext, createContext, useRef, useState } from "react";



const CreatePlayContext = createContext(null);
export const usePlayContext = () => useContext(CreatePlayContext);


const PlayContext = ({ children }) => {
    const samplerRef = useRef("");
    const sequencesRef = useRef([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(140);
    const [volume, setVolume] = useState(0);

    return (
        <CreatePlayContext.Provider value={{samplerRef, sequencesRef, isPlaying, setIsPlaying, bpm, setBpm, volume, setVolume}}>
            {children}
        </CreatePlayContext.Provider>
    );
};

export default PlayContext;
