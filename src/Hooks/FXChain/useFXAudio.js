import { useRef, useCallback } from "react";
import * as Tone from "tone";
import { useSampleContext } from "../../Contexts/ChannelProvider";
import { DEFAULT_FX_PARAMS } from "../../store/useFXStore";

/**
 * Crée un nœud FX Tone.js selon son nom.
 * Retourne null si fxName inconnu ou vide.
 */
function createFXNode(fxName, params = {}) {
  const p = { ...DEFAULT_FX_PARAMS[fxName], ...params };
  switch (fxName) {
    case "Reverberator":
      return new Tone.Reverb({ decay: p.decay, wet: p.wet });
    case "Hypno Chorus":
      return new Tone.Chorus({ rate: p.rate, depth: p.depth, feedback: p.feedback }).start();
    case "Super Delay":
      return new Tone.FeedbackDelay({ delayTime: p.delayTime, feedback: p.feedback });
    case "Complex Distortion":
      return new Tone.Distortion({ distortion: p.distortion, oversample: p.oversample });
    default:
      return null;
  }
}

function disposeSafely(node) {
  if (!node) return;
  try { node.dispose(); } catch { /* silencieux */ }
}

export function useFXAudio() {
  const { getSampler } = useSampleContext();

  // Maps stables : instrumentName → nœud Tone.js
  // Ces refs ne provoquent jamais de re-render.
  const volumeNodes = useRef(new Map()); // Map<name, Tone.Volume>
  const fxNodes     = useRef(new Map()); // Map<name, Tone.ToneAudioNode | null>

  /**
   * (Re)construit le routing audio pour un canal.
   * sampler → volumeNode → [fxNode] → Destination
   */
  const applyFX = useCallback((instrumentName, fxName) => {
    const sampler = getSampler(instrumentName);
    if (!sampler) return;

    // ── VolumeNode : créer si absent ─────────────────────────────────────
    let volNode = volumeNodes.current.get(instrumentName);
    if (!volNode) {
      volNode = new Tone.Volume(0);
      volumeNodes.current.set(instrumentName, volNode);
    }

    // ── Déconnecter tout l'ancien routing ─────────────────────────────────
    try { sampler.disconnect(); }  catch { /* ignoré si pas connecté */ }
    try { volNode.disconnect(); }  catch {}

    const oldFX = fxNodes.current.get(instrumentName);
    if (oldFX) {
      try { oldFX.disconnect(); } catch {}
      disposeSafely(oldFX);
      fxNodes.current.delete(instrumentName);
    }

    // ── Nouveau routing ────────────────────────────────────────────────────
    if (!fxName) {
      // Pas de FX : sampler → volume → destination
      sampler.connect(volNode);
      volNode.toDestination();
      return;
    }

    const fxNode = createFXNode(fxName);
    if (!fxNode) {
      // FX inconnu → routing direct
      sampler.connect(volNode);
      volNode.toDestination();
      return;
    }

    // sampler → volume → fx → destination
    sampler.connect(volNode);
    volNode.connect(fxNode);
    fxNode.toDestination();
    fxNodes.current.set(instrumentName, fxNode);
  }, [getSampler]);

  /**
   * Ajuste le volume (valeur UI 0–50 → dB : -50 à 0).
   */
  const setVolume = useCallback((instrumentName, uiValue) => {
    let volNode = volumeNodes.current.get(instrumentName);
    if (!volNode) {
      volNode = new Tone.Volume(0);
      volumeNodes.current.set(instrumentName, volNode);
    }
    volNode.volume.value = uiValue - 50; // 0 → -50dB, 50 → 0dB
  }, []);

  /**
   * Libère tous les nœuds d'un canal (ex: canal supprimé).
   */
  const disposeChannel = useCallback((instrumentName) => {
    disposeSafely(volumeNodes.current.get(instrumentName));
    disposeSafely(fxNodes.current.get(instrumentName));
    volumeNodes.current.delete(instrumentName);
    fxNodes.current.delete(instrumentName);
  }, []);

  return { applyFX, setVolume, disposeChannel };
}