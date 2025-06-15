import { useState, useMemo } from "react";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";

export default function SoundBrowser({ kits }) {
  const { colorsComponent } = useGlobalColorContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  // Récupère tous les sons sous forme de tableau
  const allSounds = useMemo(() => {
    return Object.entries(kits).flatMap(([kitKey, kit]) =>
      Object.entries(kit.sounds).map(([soundKey, sound]) => ({
        ...sound,
        kitName: kit.name,
        kitKey,
        soundKey
      }))
    );
  }, [kits]);

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

  const handlePlay = (url) => {
    const audio = new Audio(url);
    audio.play().catch((e) => console.warn("Playback failed:", e));
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
        <h2 className="text-lg font-semibold">Sound Browser</h2>
        <p className="text-sm text-gray-400 mb-2">Drag and drop / Click to preview</p>

        <input
          type="text"
          placeholder="Rechercher un son ou un tag..."
          className="w-full p-2 mb-3 rounded border"
          style={{ borderColor: colorsComponent.Border, backgroundColor: colorsComponent.Background, color: colorsComponent.Text }}
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
        {filteredSounds.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun son trouvé...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredSounds.map((sound) => (
              <div
                key={sound.soundKey + sound.kitKey}
                className="p-2 rounded hover:bg-opacity-30 cursor-pointer border text-sm"
                draggable
                onClick={() => handlePlay(sound.url)}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", JSON.stringify(sound));
                }}
                style={{
                  backgroundColor: colorsComponent.Background,
                  borderColor: colorsComponent.Border,
                  borderWidth: "1px"
                }}
              >
                <p className="font-medium">{sound.name}</p>
                <p className="text-xs text-gray-400">Kit: {sound.kitName}</p>
                <p className="text-xs text-gray-400">Key: {sound.key}</p>
                <p className="text-xs text-gray-400">Tags: {sound.tags.join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
