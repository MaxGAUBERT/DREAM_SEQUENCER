import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

export const soundBank = {
  drumKits: {
    electronic: {
      name: "electronic Drum Kit",
      description: "Kit de sons électroniques",
      bpm: 120,
      sounds: {
        kick: {
          name: "Kick Drum",
          url: "/Audio/Drums/Progressive_Kick.wav",
          key: "C1",
          volume: 0.8,
          tags: ["drum", "low", "punch"],
        },
        snare: {
          name: "Snare Drum",
          url: "/Audio/Drums/VEC1_Snare_025.wav",
          key: "D1",
          volume: 0.7,
          tags: ["drum", "mid", "crack"],
        },
        hihat_closed: {
          name: "Closed Hi-Hat",
          url: "/Audio/Drums/VEC4_Closed_HH_018.wav",
          key: "F#1",
          volume: 0.6,
          tags: ["cymbal", "high", "tight"],
        },
        hihat_open: {
          name: "Open Hi-Hat",
          url: "/Audio/Drums/VEE_Open_Hihat_06.wav",
          key: "A#1",
          volume: 0.6,
          tags: ["cymbal", "high", "open"],
        },
        "basic clap": {
          name: "Clap",
          url: "/Audio/Drums/VEH3_Claps_011.wav",
          key: "D#1",
          volume: 0.6,
          tags: ["clap", "high"],
        },
        "future clap": {
          name: "Future Clap",
          url: "/Audio/Drums/KSHMR_Clap_Dirty_03.wav",
          key: "D#1",
          volume: 0.6,
          tags: ["clap", "modern"],
        },
        "Super Lead": {
          name: "Super Lead",
          url: "/Audio/Leads/Pattern_11_2.wav",
          key: "C1",
          volume: 0.8,
          tags: ["lead", "epic"],
        },
        "Future Shot": {
          name: "Future Shot",
          url: "/Audio/Leads/Future_Shot.wav",
          key: "C1",
          volume: 0.8,
          tags: ["lead", "punch"],
        },
        Impact: {
          name: "Impact",
          url: "/Audio/FX/VES2_FX_Impact_48.wav",
          key: "C1",
          volume: 0.8,
          tags: ["fx", "impact"],
        },
        "Short Impact": {
          name: "Short Impact",
          url: "/Audio/FX/VEH3_Fill_Ins_128BPM_030.wav",
          key: "C4",
          volume: 0.8,
          tags: ["fx", "impact"],
        },
        Xplode: {
          name: "Xplode",
          url: "/Audio/FX/Xplode.wav",
          key: "C4",
          volume: 0.8,
          tags: ["fx", "explosion"],
        },
      },
    },
  },
};

export const useSoundBank = (bank = soundBank) => {
  const [audioObjects, setAudioObjects] = useState({});
  const [loading, setLoading] = useState(true);

  // Stockage interne des players Tone.js
  const playersRef = useRef(new Map());

  useEffect(() => {
    const loadSounds = async () => {
      try {
        // Assure que le contexte audio Tone.js est démarré
        if (Tone.context.state !== "running") {
          await Tone.start();
        }

        const sounds = {};
        let totalSounds = 0;
        let loadedSounds = 0;
        let failedSounds = 0;

        // 🔎 Compter le nombre total de sons
        for (const kit of Object.values(bank.drumKits)) {
          totalSounds += Object.keys(kit.sounds).length;
        }

        // ------------------------------------------
        // 🔥 Chargement des fichiers audio
        // ------------------------------------------
        for (const [kitKey, kit] of Object.entries(bank.drumKits)) {
          for (const [soundKey, sound] of Object.entries(kit.sounds)) {
            const soundId = `${kitKey}_${soundKey}`;
            const url = sound.url; // URL validée auparavant

            try {
              const player = new Tone.Player({
                url, // charge ici
                onload: () => {
                  loadedSounds++;
                  sounds[soundId].loaded = true;

                  if (loadedSounds + failedSounds === totalSounds) {
                    setAudioObjects({ ...sounds });
                    setLoading(false);
                  }
                },
                onerror: () => {
                  console.error("❌ Impossible de charger :", url);
                  failedSounds++;
                  sounds[soundId].error = true;

                  if (loadedSounds + failedSounds === totalSounds) {
                    setAudioObjects({ ...sounds });
                    setLoading(false);
                  }
                },
              }).toDestination();

              // Volume
              player.volume.value = Tone.gainToDb(sound.volume);

              // Stockage interne
              playersRef.current.set(soundId, player);

              // Objet accessible depuis ton interface
              sounds[soundId] = {
                name: sound.name,
                key: sound.key,
                volume: sound.volume,
                tags: sound.tags,
                url,
                kitName: kit.name,
                player,
                loaded: false,
                play: () => {
                  if (player.loaded) {
                    player.start();
                  }
                },
                stop: () => {
                  try {
                    player.stop();
                  } catch (e) {}
                },
              };
            } catch (err) {
              console.error(`💥 Erreur critique lors de la création du player (${soundId})`, err);

              failedSounds++;
              sounds[soundId] = {
                name: sound.name,
                url,
                error: true,
                play: () => console.warn("⚠️ Impossible de jouer :", sound.name),
                stop: () => {},
              };
            }
          }
        }

        // Mise à jour initiale (avant even onload)
        setAudioObjects({ ...sounds });

        if (totalSounds === 0) setLoading(false);
      } catch (error) {
        console.error("💥 Erreur majeure dans useSoundBank :", error);
        setLoading(false);
      }
    };

    loadSounds();

    // Cleanup
    return () => {
      playersRef.current.forEach((player) => player.dispose());
      playersRef.current.clear();
    };
  }, [bank]);

  // ---------------------------------------------------------
  // 🎵 API : lire un son
  // ---------------------------------------------------------
  const playSound = (kitKey, soundKey) => {
    const soundId = `${kitKey}_${soundKey}`;
    const sound = audioObjects[soundId];

    if (!sound) return console.warn("⚠️ Son introuvable :", soundId);
    if (!sound.loaded) return console.warn("⏳ Son pas encore chargé :", soundId);

    sound.play();
  };

  // ---------------------------------------------------------
  // ⛔ Stop all
  // ---------------------------------------------------------
  const stopAllSounds = () => {
    Object.values(audioObjects).forEach((s) => s.stop && s.stop());
  };

  return {
    audioObjects,
    loading,
    playSound,
    stopAllSounds,
    soundBank: bank,
  };
};
