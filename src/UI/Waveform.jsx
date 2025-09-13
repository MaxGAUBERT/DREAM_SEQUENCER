// Waveform.jsx
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export default function Waveform({ url, height = 96 }) {
  const containerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: "#94a3b8",      // gris clair
      progressColor: "#22d3ee",  // cyan
      cursorColor: "#ffffff",
      barWidth: 2,
      barGap: 1,
      normalize: true,
      responsive: true,
      minPxPerSec: 50, // zoom auto minimal (utile si sample court)
    });

    ws.load(url);
    wsRef.current = ws;

    return () => ws.destroy();
  }, [url, height]);

  return (
    <div className="rounded-lg border border-white/10 bg-black/70 p-2">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
