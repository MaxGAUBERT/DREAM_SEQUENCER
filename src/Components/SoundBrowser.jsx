import { useState, useMemo, useRef, useEffect } from "react";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";
import * as Tone from "tone";
import {useSoundBank} from "../Hooks/useSoundBank";


export default function SoundBrowser() {
  const { colorsComponent } = useGlobalColorContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const playersRef = useRef(new Map());

  const {
    soundBank: currentSoundBank, 
    loading, 
    playSound, 
    //stopAllSounds,
    audioObjects
  } = useSoundBank();

  // Nettoie les players au démontage du composant
  useEffect(() => {
    return () => {
      playersRef.current.forEach(player => {
        if (player) {
          player.dispose();
        }
      });
      playersRef.current.clear();
    };
  }, []);

  const allSounds = useMemo(() => {
    return Object.entries(currentSoundBank.drumKits).flatMap(([kitKey, kit]) =>
      Object.entries(kit.sounds).map(([soundKey, sound]) => ({
        ...sound,
        kitName: kit.name,
        kitKey,
        soundKey
      }))
    );
  }, [currentSoundBank]);

  // Extrait tous les tags uniques
  const allTags = useMemo(() => {
    const tagSet = new Set();
    allSounds.forEach((sound) => sound.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [allSounds]);

  // Filtrage par recherche + tag
  const filteredSounds = useMemo(() => {
    return allSounds.filter((sound) => {
      const matchSearch =
        sound.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sound.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchTag = activeTag ? sound.tags.includes(activeTag) : true;
      return matchSearch && matchTag;
    });
  }, [allSounds, searchTerm, activeTag]);

  // Fonction pour gérer le clic avec démarrage du contexte Tone.js
  const handleSoundClick = async (sound) => {
    try {
      // Démarre le contexte audio si nécessaire
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Contexte audio démarré');
      }

      const soundId = `${sound.kitKey}_${sound.soundKey}`;
      const audio = audioObjects[soundId];
      
      console.log('Tentative de lecture:', soundId, audio);
      
      if (audio && audio.loaded) {
        await playSound(sound.kitKey, sound.soundKey);
        console.log('Son joué:', sound.name);
      } else if (audio && !audio.loaded) {
        console.warn('Son pas encore chargé:', sound.name);
      } else {
        console.error('Audio object non trouvé pour:', soundId);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du son:', error);
    }
  };
  
  return (
    <div
      className="w-[400px] max-h-[560px] overflow-y-auto rounded-md border shadow"
      style={{
        backgroundColor: colorsComponent.Background,
        color: colorsComponent.Text,
        borderColor: colorsComponent.Border
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: colorsComponent.Border }}>
        <h2 className="text-lg font-semibold" style={{ color: colorsComponent.Text }}>Sound Browser</h2>
        <p className="text-sm mb-2">Drag and drop / Click to preview</p>

        <input
          type="text"
          placeholder="Search by name or tag"
          className="w-full p-2 mb-3 rounded border"
          style={{ 
            borderColor: colorsComponent.Border, 
            backgroundColor: colorsComponent.Background, 
            color: colorsComponent.Text 
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 mb-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`px-3 py-1 text-xs rounded-full border ${
                tag === activeTag ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2">
        {loading && <p className="text-sm text-gray-400">Chargement des sons...</p>}
        
        {!loading && filteredSounds.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun son trouvé...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredSounds.map((sound) => {
              const soundId = `${sound.kitKey}_${sound.soundKey}`;
              const audio = audioObjects[soundId];
              const isLoaded = audio?.loaded;
              const hasError = audio?.error;

              return (
                <div
                  key={`${sound.kitKey}_${sound.soundKey}`}
                  className="p-2 rounded hover:bg-opacity-30 cursor-pointer border text-sm transition-all"
                  draggable
                  onClick={() => handleSoundClick(sound)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", JSON.stringify(sound));
                  }}
                  style={{
                    backgroundColor: colorsComponent.Background,
                    borderColor: colorsComponent.Border,
                    color: colorsComponent.Text,
                    borderWidth: "1px",
                    opacity: isLoaded ? 1 : 0.5,
                    cursor: isLoaded ? "pointer" : "not-allowed"
                  }}
                >
                  <p className="font-medium">{sound.name}</p>
                  <p className="text-xs text-gray-400">Kit: {sound.kitName}</p>
                  <p className="text-xs text-gray-400">Key: {sound.key}</p>
                  <p className="text-xs text-gray-400">Tags: {sound.tags.join(", ")}</p>
                  <p className="text-xs">
                    {hasError ? (
                      <span className="text-red-500">❌ Erreur de chargement</span>
                    ) : isLoaded ? (
                      <span className="text-green-500">✅ Chargé</span>
                    ) : (
                      <span className="text-yellow-500">⌛ Chargement...</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">ID: {soundId}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}