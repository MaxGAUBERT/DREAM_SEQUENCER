import { useEffect, useState } from "react";
import { usePlayContext } from "../Contexts/PlayContext";
import { FaRegCirclePlay } from "react-icons/fa6";
import { FaRegStopCircle } from "react-icons/fa";
import { PiMetronomeBold } from "react-icons/pi";
import * as Tone from "tone";
import Timer from "./Timer";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";
import {useSettings} from "../Contexts/SettingsContexts";

const TransportBar = () => {
    const {bpm, setBpm, metronome, metronomeSampler, setMetronome, isPlaying, setIsPlaying, playMode, setPlayMode, sequencesRef} = usePlayContext();
    const {colorsComponent} = useGlobalColorContext();

    useEffect(() => {
        if (metronome && metronomeSampler && metronomeSampler.loaded) {
          const metroLoop = new Tone.Loop((time) => {
            metronomeSampler.triggerAttackRelease("C4", "8n", time);
          }, "4n"); // "4n" = chaque temps (1 battement)
          
          metroLoop.start(0); // commence dès le début
          Tone.Transport.start();
    
          return () => {
            metroLoop.dispose(); // nettoyer à l'arrêt ou démontage
          };
        }
      }, [metronome, metronomeSampler, isPlaying]);


    useEffect(() => {
        console.log("PlayMode changed:", playMode);
    }, [playMode]);

    useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.ctrlKey + e.code === "KeyP") {
        e.preventDefault(); // empêche le scroll de la page
        setIsPlaying(!isPlaying); // toggle play/pause
        }

        if (e.code === "KeyM") {
        e.preventDefault(); // empêche le scroll de la page
        setMetronome(!metronome); // toggle metronome
        }

        if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        setPlayMode((prev) => (prev === "Song" ? "Pattern" : "Song"));
        }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

     const stopPlayback = () => {
        console.log("🛑 Stopping playback");
        setIsPlaying(false); // si applicable
        Tone.Transport.stop();
        Tone.Transport.cancel();
        if (sequencesRef.current) {
            sequencesRef.current.forEach(seq => {
            if (seq.state !== 'stopped') seq.stop();
            seq.dispose();
            });
            sequencesRef.current = [];
        }
    };



    return (
        <div className="flex flex-row absolute top-2 right-1/3">
            <div className="flex flex-row gap-1">
                <div className="px-2 py-1 border-gray-500 border-2 text-sm italic"> <Timer isPlaying={isPlaying}/></div>
                <div className="flex flex-row items-center border-1 border-gray-500 rounded">
                    <button
                        onClick={() => {
                            setPlayMode(playMode === "Song" ? "Pattern" : "Song");
                        }}
                        className={`px-2 py-1 rounded ${playMode === "Song" ? "bg-red-600" : "bg-green-500 hover:bg-gray-600"}`}
                        title="Switch to Song Mode [CTRL + SPACE]"
                    >
                        {playMode === "Song" ? "Pattern" : "Song"}
                    </button>
                </div>
                <button 
                    onClick={() => {
                        if (!isPlaying){
                        // Logic to play the song
                        console.log("Playing song at BPM:", bpm);
                        Tone.start();
                        setIsPlaying(!isPlaying);
                        }
                    }}
                    className="rounded hover:bg-green-600"
                    style={{ backgroundColor: colorsComponent.TransportButtons, color: colorsComponent.TextIO, borderColor: colorsComponent.Border }}
                    title="Play Song [CTRL + P]"
                >
                    <FaRegCirclePlay size={20} />
                </button>
                <button 
                    className="rounded hover:bg-red-600"
                    style={{ backgroundColor: colorsComponent.TransportButtons, color: colorsComponent.TextIO, borderColor: colorsComponent.Border }}
                    title="Stop Song [SPACE]"
                    onClick={() => {
                        stopPlayback();
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
                    className=" text-white rounded"
                    style={{ backgroundColor: colorsComponent.TransportButtons, color: colorsComponent.TextIO, borderColor: colorsComponent.Border }}
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