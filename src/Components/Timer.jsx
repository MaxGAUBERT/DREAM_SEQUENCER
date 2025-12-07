import { useEffect, useState } from "react";
import * as Tone from "tone";


const formatTime = (totalSeconds) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, "0");
  const milliseconds = String(Math.floor((totalSeconds % 1) * 1000)).padStart(2, "0");
  return `${minutes}:${seconds}:${milliseconds}`;
};


const Timer = ({ isPlaying }) => {
  const [time, setTime] = useState(0); // en secondes

  useEffect(() => {
    let intervalId;

    if (isPlaying) {
      console.log(isPlaying);
      Tone.start();
      Tone.Transport.start();

      intervalId = setInterval(() => {
        setTime(Tone.Transport.seconds.toPrecision(3));
      }, 50); // Mise à jour toutes les 200ms
      console.log("Timer started");
    } else {
      Tone.Transport.stop();
      setTime(0);
    }

    return () => {
      clearInterval(intervalId);
      Tone.Transport.stop();
      setTime(0);
    };
  }, [isPlaying]);

  return (
    <div className="text-white px-4 py-1 text-sm min-w-[80px] font-[orbitron] text-center">
      {formatTime(time)}
    </div>
  );
};

export default Timer;
