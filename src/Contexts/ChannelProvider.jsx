// Contexts/ChannelProvider.jsx
// Fournit l'accès aux samplers Tone.js.
// - Ne reçoit plus instrumentList en prop (lu depuis useDrumRackStore si besoin)
// - Protection contre les double-chargements concurrents (loadingRef)
// - unloadSample propre avec gestion d'erreur silencieuse
import { createContext, useContext, useRef, useCallback } from "react";
import * as Tone from "tone";

const SampleContext = createContext(null);
export const useSampleContext = () => useContext(SampleContext);

export const ChannelProvider = ({ children }) => {
  const samplersRef = useRef({});  // { [instrumentName]: Tone.Sampler | null }
  const loadingRef  = useRef({});  // { [instrumentName]: Promise } — évite les double-chargements

  // ── Chargement ────────────────────────────────────────────────────────────
  const loadSample = useCallback((instrumentName, sampleUrl) => {
    if (!instrumentName || !sampleUrl) {
      return Promise.reject(new Error(`loadSample: arguments invalides (name=${instrumentName}, url=${sampleUrl})`));
    }

    // Si un chargement est déjà en cours pour ce canal → retourner la même Promise
    if (loadingRef.current[instrumentName]) {
      return loadingRef.current[instrumentName];
    }

    // Détruire l'ancien sampler proprement
    const old = samplersRef.current[instrumentName];
    if (old) {
      try { old.dispose(); } catch { /* silencieux */ }
      samplersRef.current[instrumentName] = null;
    }

    const promise = new Promise((resolve, reject) => {
      try {
        const sampler = new Tone.Sampler({
          urls: { C4: sampleUrl },
          onload: () => {
            samplersRef.current[instrumentName] = sampler;
            delete loadingRef.current[instrumentName];
            resolve(sampler);
          },
          onerror: (err) => {
            delete loadingRef.current[instrumentName];
            reject(err);
          },
        }).toDestination();
      } catch (err) {
        delete loadingRef.current[instrumentName];
        reject(err);
      }
    });

    loadingRef.current[instrumentName] = promise;
    return promise;
  }, []);

  // ── Déchargement ──────────────────────────────────────────────────────────
  const unloadSample = useCallback((instrumentName) => {
    // Annuler un chargement en cours si possible
    delete loadingRef.current[instrumentName];

    const sampler = samplersRef.current[instrumentName];
    if (sampler) {
      try { sampler.dispose(); } catch { /* silencieux */ }
      samplersRef.current[instrumentName] = null;
    }
  }, []);

  // ── Lecture ───────────────────────────────────────────────────────────────
  const getSampler = useCallback((instrumentName) => {
    return samplersRef.current[instrumentName] ?? null;
  }, []);

  // ── Statut ────────────────────────────────────────────────────────────────
  const isLoading = useCallback((instrumentName) => {
    return Boolean(loadingRef.current[instrumentName]);
  }, []);

  return (
    <SampleContext.Provider value={{ loadSample, unloadSample, getSampler, isLoading }}>
      {children}
    </SampleContext.Provider>
  );
};

export default ChannelProvider;