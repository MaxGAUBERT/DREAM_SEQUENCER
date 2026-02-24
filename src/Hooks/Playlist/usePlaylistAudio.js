import { useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { usePlayContext } from "../../Contexts/PlayContext";
import { useSampleContext } from "../../Contexts/ChannelProvider";
import { useDrumRackStore } from "../../store/useDrumRackStore";
import { usePatternStore }  from "../../store/usePatternStore";
import { usePlaylistStore } from "../../store/usePlaylistStore";
import { rowToNoteName } from "../../Components/Utils/noteUtils";

export function usePlaylistAudio() {
  const { isPlaying, playMode, bpm } = usePlayContext();
  const { getSampler }               = useSampleContext();

  const instrumentList = useDrumRackStore((s) => s.instrumentList);
  const patterns       = usePatternStore((s) => s.patterns);
  const cells          = usePlaylistStore((s) => s.cells);
  const width          = usePlaylistStore((s) => s.width);
  const height         = usePlaylistStore((s) => s.height);
  const numSteps       = useDrumRackStore((s) => s.numSteps);

  const currentColumnRef = useRef(null);
  const setCurrentColumn = usePlaylistStore.getState; 

  // Joue tous les samples/notes d'un pattern à un temps donné
  const playPattern = useCallback((pattern, startTime) => {
    const stepDuration = Tone.Time("16n").toSeconds();

    Object.entries(instrumentList).forEach(([name, data]) => {
      const sampler = getSampler(name);
      if (!sampler?.loaded || data.muted) return;

      // Steps du drum rack
      const steps = data.grids?.[pattern.id] ?? [];
      steps.forEach((active, i) => {
        if (active) sampler.triggerAttackRelease("C4", "4n", startTime + i * stepDuration);
      });

      // Notes du piano roll
      const notes = data.pianoData?.[pattern.id] ?? [];
      notes.forEach((note) => {
        if (!note) return;
        const time     = startTime + note.start * stepDuration;
        const duration = Tone.Time(note.length * stepDuration * 2).toNotation();
        sampler.triggerAttackRelease(
          rowToNoteName(note.row),
          duration,
          time,
          note.velocity ?? 1
        );
      });
    });
  }, [instrumentList, getSampler]);

  // Retourne le setter de colonne active pour que Playlist puisse l'afficher
  const activeColRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || playMode !== "Song" || !instrumentList) return;

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    const stepDuration  = Tone.Time("16n").toSeconds();
    const patternDuration = stepDuration * numSteps;
    let col = 0;

    const repeatId = Tone.Transport.scheduleRepeat((time) => {
      activeColRef.current = col;

      for (let row = 0; row < height; row++) {
        const cellValue = cells[row * width + col];
        if (!cellValue) continue;
        const pattern = patterns.find((p) => p.id === cellValue - 1);
        if (pattern) playPattern(pattern, time);
      }

      col = (col + 1) % width;
    }, patternDuration);

    Tone.Transport.start();

    return () => {
      Tone.Transport.clear(repeatId);
      Tone.Transport.stop();
      activeColRef.current = null;
    };
  }, [isPlaying, playMode, bpm, cells, patterns, numSteps, width, height, playPattern]);

  return { activeColRef };
}