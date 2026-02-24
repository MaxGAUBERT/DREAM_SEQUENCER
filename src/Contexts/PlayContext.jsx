import {
  createContext, useContext, useRef,
  useState, useMemo, useEffect, useCallback,
} from "react";
import * as Tone from "tone";
import { useSettings } from "./SettingsContexts";

const PlayContextValue = createContext(null);
export const usePlayContext = () => useContext(PlayContextValue);

// sequencesRef partagé via un module singleton — les hooks audio l'importent directement
// sans polluer le contexte React.
export const sharedSequencesRef = { current: [] };

const PlayContext = ({ children }) => {
  const { settings } = useSettings();

  const [playMode,  setPlayMode]  = useState("Song");
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm,       setBpm]       = useState(settings?.bpm ?? 130);
  const [volume,    setVolume]    = useState(0);      // dB, 0 = nominal
  const [metronome, setMetronome] = useState(false);

  // ── Métronome ────────────────────────────────────────────────────────────
  const metronomeSamplerRef = useRef(null);
  const metronomeSeqRef     = useRef(null);

  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls: { C4: "metronome.mp3" },
      baseUrl: "/Audio/",
    }).toDestination();

    metronomeSamplerRef.current = sampler;

    return () => {
      try { sampler.dispose(); } catch { /* silencieux */ }
    };
  }, []);

  // Démarrer / arrêter le métronome selon l'état
  useEffect(() => {
    if (!metronomeSamplerRef.current) return;

    if (metronome && isPlaying) {
      const seq = new Tone.Sequence(
        (time) => metronomeSamplerRef.current?.triggerAttackRelease("C4", "8n", time),
        [0],
        "4n"
      );
      seq.start(0);
      metronomeSeqRef.current = seq;
    } else {
      metronomeSeqRef.current?.stop();
      metronomeSeqRef.current?.dispose();
      metronomeSeqRef.current = null;
    }

    return () => {
      metronomeSeqRef.current?.stop();
      metronomeSeqRef.current?.dispose();
      metronomeSeqRef.current = null;
    };
  }, [metronome, isPlaying]);

  // ── BPM ──────────────────────────────────────────────────────────────────
  // Sync depuis Settings
  useEffect(() => {
    if (settings?.bpm !== undefined) setBpm(settings.bpm);
  }, [settings?.bpm]);

  // Applique au transport
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // ── Volume ───────────────────────────────────────────────────────────────
  // Applique au master (Tone.Destination = master output)
  useEffect(() => {
    Tone.Destination.volume.value = volume;
  }, [volume]);

  // ── Helpers stables ──────────────────────────────────────────────────────
  // Accesseur pour les hooks audio qui ont besoin de sequencesRef
  const getSequencesRef = useCallback(() => sharedSequencesRef, []);

  // ── Valeur du contexte ───────────────────────────────────────────────────
  // On n'expose PAS metronomeSampler ni sequencesRef directement —
  // ce sont des détails d'implémentation audio.
  const contextValue = useMemo(() => ({
    playMode,  setPlayMode,
    isPlaying, setIsPlaying,
    bpm,       setBpm,
    volume,    setVolume,
    metronome, setMetronome,
    getSequencesRef,            // pour les hooks audio uniquement
  }), [playMode, isPlaying, bpm, volume, metronome, getSequencesRef]);

  return (
    <PlayContextValue.Provider value={contextValue}>
      {children}
    </PlayContextValue.Provider>
  );
};

export default PlayContext;