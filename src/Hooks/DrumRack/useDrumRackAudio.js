import { useEffect, useRef } from "react";
import * as Tone from "tone";
import { usePlayContext, sharedSequencesRef } from "../../Contexts/PlayContext";
import { useSampleContext } from "../../Contexts/ChannelProvider";
import { useDrumRackStore } from "../../store/useDrumRackStore";

const PLAY_MODE = "Pattern";

function normalizeGrid(grid, length) {
  const result = Array.isArray(grid) ? [...grid] : [];
  while (result.length < length) result.push(false);
  return result.slice(0, length);
}

export function useDrumRackAudio(selectedPatternID) {
  const { isPlaying, playMode, bpm } = usePlayContext();
  const sequencesRef = sharedSequencesRef;
  const { getSampler, loadSample } = useSampleContext();

  // Lecture directe du store sans provoquer de re-render sur ce hook
  const instrumentList = useDrumRackStore((s) => s.instrumentList);
  const numSteps       = useDrumRackStore((s) => s.numSteps);

  const pendingLoadRef = useRef(new Set());

  useEffect(() => {
    // ── Nettoyage systématique ───────────────────────────────────────────────
    const cleanup = () => {
      if (Tone.Transport.state === "started") Tone.Transport.stop();
      Tone.Transport.cancel();
      sequencesRef.current.forEach((seq) => {
        if (seq.state !== "stopped") seq.stop();
        seq.dispose();
      });
      sequencesRef.current = [];
      pendingLoadRef.current.clear();
    };

    cleanup();

    if (!isPlaying || playMode !== PLAY_MODE || !instrumentList) return;

    // ── Mise à jour BPM ─────────────────────────────────────────────────────
    Tone.Transport.bpm.value = bpm;

    let hasValidSequences = false;

    Object.entries(instrumentList).forEach(([name, data]) => {
      if (data.muted) return;

      const rawGrid = data.grids?.[selectedPatternID];
      if (!Array.isArray(rawGrid)) return;

      let sampler = getSampler(name);

      if (!sampler) {
        const url = data.sampleUrl;
        if (!url || pendingLoadRef.current.has(name)) return;
        pendingLoadRef.current.add(name);
        loadSample(name, url);
        return; // attendre le prochain render après chargement
      }

      const grid = normalizeGrid(rawGrid, numSteps);
      if (!grid.some(Boolean)) return; // aucun step actif

      try {
        const seq = new Tone.Sequence(
          (time, stepIndex) => {
            if (grid[stepIndex] && sampler.loaded !== false) {
              sampler.triggerAttackRelease("C4", "4n", time);
            }
          },
          Array.from({ length: numSteps }, (_, i) => i),
          "16n"
        );

        seq.start(0);
        sequencesRef.current.push(seq);
        hasValidSequences = true;
      } catch (err) {
        console.error(`[DrumRack] Sequence error for "${name}":`, err);
      }
    });

    if (hasValidSequences) {
      Tone.Transport.start();
    }

    return cleanup;
  }, [isPlaying, bpm, playMode, numSteps, instrumentList, selectedPatternID]);
}