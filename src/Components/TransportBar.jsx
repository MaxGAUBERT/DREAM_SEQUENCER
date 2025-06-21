import { useState, useEffect } from "react";
import { usePlayContext } from "../Contexts/PlayContext";
import { FaRegCirclePlay } from "react-icons/fa6";
import { FaRegStopCircle } from "react-icons/fa";
import { PiMetronomeBold } from "react-icons/pi";
import { RadioGroup } from "@headlessui/react";


const TransportBar = () => {
    const {bpm, setBpm, metronome, setMetronome, isPlayling, setIsPlaying, playMode, setPlayMode} = usePlayContext();


    return (
        <div className="flex flex-row absolute top-2 right-100">
            <div className="flex flex-row gap-1">
                <div className="flex flex-row gap-1 items-center border-2 border-gray-500 rounded p-1">
                    <label className="text-white">Mode {playMode}</label>
                    <input
                        type="radio"
                        name="playMode"
                        value="Song"
                        checked={playMode === "Song"}
                        onChange={() => setPlayMode("Song")}
                        className="bg-gray-500 text-white rounded w-5"
                        title="Song Mode"
                    />
                    <input
                        type="radio"
                        name="playMode"
                        value="Pattern"
                        checked={playMode === "Pattern"}
                        onChange={() => setPlayMode("Pattern")}
                        className="bg-gray-500 text-white rounded w-5"
                        title="Pattern Mode"
                    />

                </div>
                <button 
                    onClick={() => {
                        // Logic to play the song
                        console.log("Playing song at BPM:", bpm);
                        setIsPlaying(!isPlayling);
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