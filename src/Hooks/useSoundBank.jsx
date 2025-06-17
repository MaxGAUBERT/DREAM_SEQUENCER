import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

export const soundBank = {
  "drumKits": {
    "acoustic": {
      "name": "Acoustic Drum Kit",
      "description": "Kit de batterie acoustique traditionnel",
      "bpm": 120,
      "sounds": {
        "kick": {
          "name": "Kick Drum",
          "url": "/Audio/Drums/Progressive_Kick.wav",
          "key": "C1",
          "volume": 0.8,
          "tags": ["drum", "low", "punch"]
        },
        "snare": {
          "name": "Snare Drum",
          "url": "./Audio/Drums/VEC1_Snare_025.wav",
          "key": "D1",
          "volume": 0.7,
          "tags": ["drum", "mid", "crack"]
        },
        "hihat_closed": {
          "name": "Hi-Hat Fermé",
          "url": "./Audio/Drums/VEC4_Closed_HH_018.wav",
          "key": "F#1",
          "volume": 0.6,
          "tags": ["cymbal", "high", "tight"]
        },
        "hihat_open": {
          "name": "Hi-Hat Ouvert",
          "url": "./Audio/Drums/VEE_Open_Hihat_06.wav",
          "key": "A#1",
          "volume": 0.6,
          "tags": ["cymbal", "high", "open"]
        },
        "crash": {
          "name": "Crash Cymbal",
          "url": "./Audio/acoustic/crash.wav",
          "key": "C#2",
          "volume": 0.5,
          "tags": ["cymbal", "high", "crash"]
        }
      }
    },
    "electronic": {
      "name": "Electronic Drum Kit",
      "description": "Kit de samples electro",
      "bpm": 128,
      "sounds": {
        "snare_clap": {
          "name": "Clap Snare",
          "url": "./Audio/electronic/snare_clap.wav",
          "key": "D1",
          "volume": 0.8,
          "tags": ["electronic", "clap", "mid"]
        },
        "hihat_digital": {
          "name": "Hi-Hat Digital",
          "url": "./Audio/electronic/hihat_digital.wav",
          "key": "F#1",
          "volume": 0.6,
          "tags": ["electronic", "high", "digital"]
        },
        "perc_shaker": {
          "name": "Shaker",
          "url": "./Audio/electronic/shaker.wav",
          "key": "G#1",
          "volume": 0.5,
          "tags": ["percussion", "high", "rhythm"]
        },
        "bass_sub": {
          "name": "Sub Bass",
          "url": "./Audio/electronic/bass_sub.wav",
          "key": "C2",
          "volume": 0.8,
          "tags": ["bass", "sub", "low"]
        },
        "fx_riser": {
          "name": "Riser FX",
          "url": "./Audio/electronic/fx_riser.wav",
          "key": "D#3",
          "volume": 0.6,
          "tags": ["fx", "riser", "transition"]
        }
      }
    }
  },
  "metadata": {
    "version": "1.0",
    "created": "2025-06-15",
    "totalAudio": 35,
    "supportedFormats": ["wav", "mp3", "ogg", "m4a", "aiff"],
    "keyMapping": {
      "description": "Mapping MIDI standard pour les pads",
      "C1": 36,
      "C#1": 37,
      "D1": 38,
      "D#1": 39,
      "E1": 40,
      "F1": 41,
      "F#1": 42,
      "G1": 43,
      "G#1": 44,
      "A1": 45,
      "A#1": 46,
      "B1": 47,
      "C2": 48
    },
    "usage": {
      "instructions": [
        "1. Remplacez les URLs par vos chemins locaux",
        "2. Organisez vos Audio dans des dossiers correspondants",
        "3. Respectez les noms de fichiers ou modifiez le JSON",
        "4. Ajustez les volumes selon vos besoins",
        "5. Utilisez les tags pour filtrer les sons"
      ],
      "folderStructure": {
        "Audio/": {
          "acoustic/": ["kick.wav", "snare.wav", "hihat_closed.wav", "..."],
          "electronic/": ["kick_808.wav", "snare_clap.wav", "hihat_digital.wav", "..."],
          "hip_hop/": ["kick_boom.wav", "snare_crack.wav", "hihat_trap.wav", "..."],
          "ambient/": ["pad_warm.wav", "rain_texture.wav", "drone_deep.wav", "..."],
          "piano/": ["piano_c4.wav", "piano_g4.wav", "piano_c5.wav"],
          "strings/": ["strings_c3.wav", "strings_g3.wav", "violin_solo.wav"],
          "fx/": ["whoosh.wav", "impact.wav", "reverse_crash.wav", "digital_glitch.wav"]
        }
      }
    }
  }
};

export const useSoundBank = (bank = soundBank) => {
  const [audioObjects, setAudioObjects] = useState({});
  const [loading, setLoading] = useState(true);
  const playersRef = useRef(new Map());

  useEffect(() => {
    const loadSounds = async () => {
      console.log('🔄 Début du chargement des sons...');
      console.log('Bank reçu:', bank);
      
      try {
        // Démarre le contexte audio Tone.js
        if (Tone.context.state !== 'running') {
          console.log('🎵 Démarrage du contexte Tone.js...');
          await Tone.start();
        }

        const sounds = {};
        let totalSounds = 0;
        let loadedSounds = 0;
        let errorSounds = 0;
        
        // Compte le nombre total de sons
        for (const [kitKey, kit] of Object.entries(bank.drumKits)) {
          totalSounds += Object.keys(kit.sounds).length;
        }
        
        console.log(`📊 Total de sons à charger: ${totalSounds}`);
        
        // Parcourt tous les kits et leurs sons
        for (const [kitKey, kit] of Object.entries(bank.drumKits)) {
          console.log(`🎹 Chargement du kit: ${kitKey} (${kit.name})`);
          
          for (const [soundKey, sound] of Object.entries(kit.sounds)) {
            const soundId = `${kitKey}_${soundKey}`;
            console.log(`🔊 Chargement du son: ${soundId} - ${sound.name} (${sound.url})`);
            
            try {
              // Crée un player Tone.js pour chaque son
              const player = new Tone.Player().toDestination();
              
              // Configure le volume
              player.volume.value = Tone.gainToDb(sound.volume);
              
              // Stocke le player
              playersRef.current.set(soundId, player);
              
              // Crée l'objet son
              sounds[soundId] = {
                play: async () => {
                  try {
                    console.log(`▶️ Tentative de lecture: ${sound.name}`);
                    if (player.loaded) {
                      // Arrête la lecture précédente si elle est en cours
                      if (player.state === 'started') {
                        player.stop();
                      }
                      player.start();
                      console.log(`✅ Son joué: ${sound.name}`);
                    } else {
                      console.warn(`⚠️ Son ${sound.name} pas encore chargé`);
                    }
                  } catch (error) {
                    console.error(`❌ Erreur lors de la lecture de ${sound.name}:`, error);
                  }
                },
                stop: () => {
                  if (player.state === 'started') {
                    player.stop();
                  }
                },
                player: player,
                name: sound.name,
                key: sound.key,
                volume: sound.volume,
                tags: sound.tags,
                kitName: kit.name,
                loaded: false,
                soundData: sound,
                url: sound.url
              };

              // Charge le fichier audio de manière asynchrone
              player.load(sound.url).then(() => {
                console.log(`✅ Fichier chargé: ${sound.name}`);
                sounds[soundId].loaded = true;
                loadedSounds++;
                
                // Met à jour l'état si tous les sons sont chargés
                if (loadedSounds + errorSounds === totalSounds) {
                  console.log(`🎉 Tous les sons traités! Chargés: ${loadedSounds}, Erreurs: ${errorSounds}`);
                  setAudioObjects({...sounds});
                  setLoading(false);
                }
              }).catch((error) => {
                console.error(`❌ Erreur lors du chargement de ${sound.name}:`, error);
                sounds[soundId].error = true;
                sounds[soundId].loaded = false;
                errorSounds++;
                
                // Met à jour l'état même en cas d'erreur
                if (loadedSounds + errorSounds === totalSounds) {
                  console.log(`🎉 Tous les sons traités! Chargés: ${loadedSounds}, Erreurs: ${errorSounds}`);
                  setAudioObjects({...sounds});
                  setLoading(false);
                }
              });
              
            } catch (error) {
              console.error(`❌ Erreur lors de la création du player pour ${sound.name}:`, error);
              sounds[soundId] = {
                play: () => console.warn(`⚠️ Impossible de jouer ${sound.name}`),
                stop: () => {},
                player: null,
                name: sound.name,
                key: sound.key,
                volume: sound.volume,
                tags: sound.tags,
                kitName: kit.name,
                loaded: false,
                soundData: sound,
                error: true,
                url: sound.url
              };
              errorSounds++;
            }
          }
        }
        
        // Met à jour immédiatement l'état avec les objets créés (même s'ils ne sont pas encore chargés)
        console.log('📦 Mise à jour initiale des audioObjects:', Object.keys(sounds));
        setAudioObjects({...sounds});
        
        // Si aucun son à charger, arrête le loading
        if (totalSounds === 0) {
          setLoading(false);
        }
        
      } catch (error) {
        console.error('💥 Erreur critique lors du chargement des sons:', error);
        setLoading(false);
      }
    };

    loadSounds();

    // Nettoyage au démontage
    return () => {
      console.log('🧹 Nettoyage des players...');
      playersRef.current.forEach(player => {
        if (player) {
          player.dispose();
        }
      });
      playersRef.current.clear();
    };
  }, [bank]);

  // Fonction utilitaire pour jouer un son par kit et clé
  const playSound = (kitKey, soundKey) => {
    const soundId = `${kitKey}_${soundKey}`;
    console.log(`🎵 Demande de lecture: ${soundId}`);
    const sound = audioObjects[soundId];
    if (sound) {
      sound.play();
    } else {
      console.warn(`⚠️ Son ${soundId} non trouvé dans audioObjects`);
      console.log('📋 AudioObjects disponibles:', Object.keys(audioObjects));
    }
  };

  // Fonction utilitaire pour arrêter tous les sons
  const stopAllSounds = () => {
    console.log('⏹️ Arrêt de tous les sons...');
    Object.values(audioObjects).forEach(sound => {
      if (sound.stop) {
        sound.stop();
      }
    });
  };

  return { 
    audioObjects, 
    loading, 
    playSound, 
    stopAllSounds,
    soundBank: bank 
  };
};