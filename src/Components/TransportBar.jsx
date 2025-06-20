import { useState, useEffect } from "react";
import { usePlayContext } from "../Contexts/PlayContext";
import { FaRegCirclePlay } from "react-icons/fa6";
import { FaRegStopCircle } from "react-icons/fa";
import { PiMetronomeBold } from "react-icons/pi";


const TransportBar = () => {
    const {bpm, setBpm, metronome, setMetronome} = usePlayContext();


    return (
        <div className="flex flex-row absolute top-2 right-100">
            <div className="flex flex-row gap-1">
                <button 
                    className="bg-gray-500 text-white rounded hover:bg-green-600"
                    title="Play Song"
                >
                    <FaRegCirclePlay size={20} />
                </button>
                <button 
                    className="bg-gray-500 text-white rounded hover:bg-red-600"
                    title="Stop Song"
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