import { useState, useEffect } from "react";


export const soundBank = {
  "drumKits": {
    "acoustic": {
      "name": "Acoustic Drum Kit",
      "description": "Kit de batterie acoustique traditionnel",
      "bpm": 120,
      "sounds": {
        "kick": {
          "name": "Kick Drum",
          "url": "./Audio/acoustic/kick.wav",
          "key": "C1",
          "volume": 0.8,
          "tags": ["drum", "low", "punch"]
        },
        "snare": {
          "name": "Snare Drum",
          "url": "./Audio/acoustic/",
          "key": "D1",
          "volume": 0.7,
          "tags": ["drum", "mid", "crack"]
        },
        "hihat_closed": {
          "name": "Hi-Hat Fermé",
          "url": "./Audio/acoustic/hihat_closed.wav",
          "key": "F#1",
          "volume": 0.6,
          "tags": ["cymbal", "high", "tight"]
        },
        "hihat_open": {
          "name": "Hi-Hat Ouvert",
          "url": "./Audio/acoustic/hihat_open.wav",
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
        },
        "ride": {
          "name": "Ride Cymbal",
          "url": "./Audio/acoustic/ride.wav",
          "key": "D#2",
          "volume": 0.6,
          "tags": ["cymbal", "high", "sustain"]
        },
        "tom_high": {
          "name": "Tom Aigu",
          "url": "./Audio/acoustic/tom_high.wav",
          "key": "G1",
          "volume": 0.7,
          "tags": ["drum", "mid", "tom"]
        },
        "tom_mid": {
          "name": "Tom Medium",
          "url": "./Audio/acoustic/tom_mid.wav",
          "key": "A1",
          "volume": 0.7,
          "tags": ["drum", "mid", "tom"]
        },
        "tom_low": {
          "name": "Tom Grave",
          "url": "./Audio/acoustic/tom_low.wav",
          "key": "C2",
          "volume": 0.7,
          "tags": ["drum", "low", "tom"]
        }
      }
    },
    "electronic": {
      "name": "Electronic Drum Kit",
      "description": "Kit de samples electro",
      "bpm": 128,
      "sounds": {
        "kick_808": {
          "name": "808 Kick",
          "url": "./Audio/electronic/kick_808.wav",
          "key": "C1",
          "volume": 0.9,
          "tags": ["electronic", "bass", "808"]
        },
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
        "synth_lead": {
          "name": "Synth Lead",
          "url": "./Audio/electronic/synth_lead.wav",
          "key": "C3",
          "volume": 0.7,
          "tags": ["synth", "lead", "melody"]
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
        },
        "vocal_chop": {
          "name": "Vocal Chop",
          "url": "./Audio/electronic/vocal_chop.wav",
          "key": "F3",
          "volume": 0.7,
          "tags": ["vocal", "chop", "texture"]
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
}



export const useSoundBank = (bank = soundBank) => {
  const [audioObjects, setAudioObjects] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSounds = async () => {
      const sounds = {};
      
      for (const sample of soundBank.samples) {
        try {
          // En développement, on simule le chargement
          // En production, remplacez par : new Audio(sample.url)
          sounds[sample.id] = {
            play: () => console.log(`Playing ${sample.name}`),
            name: sample.name,
            loaded: true
          };
        } catch (error) {
          console.error(`Erreur lors du chargement de ${sample.name}:`, error);
          sounds[sample.id] = {
            play: () => {},
            name: sample.name,
            loaded: false
          };
        }
      }
      
      setAudioObjects(sounds);
      setLoading(false);
    };

    loadSounds();
  }, [bank]);

  return { audioObjects, loading };
};
