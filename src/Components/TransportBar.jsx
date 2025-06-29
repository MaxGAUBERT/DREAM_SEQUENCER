import { useEffect } from "react";
import { usePlayContext } from "../Contexts/PlayContext";
import { FaRegCirclePlay } from "react-icons/fa6";
import { FaRegStopCircle } from "react-icons/fa";
import { PiMetronomeBold } from "react-icons/pi";
import { Tone } from "tone/build/esm/core/Tone";

const TransportBar = () => {
    const {bpm, setBpm, metronome, setMetronome, isPlayling, setIsPlaying, playMode, setPlayMode} = usePlayContext();

    useEffect(() => {
        console.log("PlayMode changed:", playMode);
    }, [playMode]);

    return (
        <div className="flex flex-row absolute top-2 right-100">
            <div className="flex flex-row gap-1">
                <div className="flex flex-row items-center border-1 border-gray-500 rounded">
                    <button
                        onClick={() => setPlayMode(playMode === "Song" ? "Pattern" : "Song")}
                        className={`px-2 py-1 rounded ${playMode === "Song" ? "bg-red-600" : "bg-green-500 hover:bg-gray-600"}`}
                        title="Switch to Song Mode"
                    >
                        {playMode === "Song" ? "Pattern" : "Song"}
                    </button>
                </div>
                <button 
                    onClick={() => {
                        if (!isPlayling){
                        // Logic to play the song
                        console.log("Playing song at BPM:", bpm);
                        setIsPlaying(!isPlayling);
                        }
                        
                    }}
                    className="bg-gray-500 rounded hover:bg-green-600"
                    title="Play Song"
                >
                    <FaRegCirclePlay size={20} />
                </button>
                <button 
                    className="bg-gray-500 rounded hover:bg-red-600"
                    title="Stop Song"
                    onClick={() => {
                        // Logic to stop the song
                        console.log("Stopping pattern");
                        setIsPlaying(false);
                        Tone.Transport().cancel();
                    }}
                >
                    <FaRegStopCircle size={20} />
                </button>
                <input
                    type="number"
                    min="100"
                    max="200"
                    step="10"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    className="bg-gray-500 text-white rounded"
                    title="Adjust BPM"
                />
                <button 
                    className="bg-gray-500 text-white rounded"
                    title="Metronome"
                    style={{ backgroundColor: metronome ? "blue" : "gray" }}
                    onClick={() => setMetronome(!metronome)}
                >
                    <PiMetronomeBold size={20} />
                </button>




            </div>
        </div>
    )
};

export default TransportBar;