import { useState, useEffect } from "react";

const MiniBrowser = () => {
  const [sounds, setSounds] = useState([]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const newSounds = files
      .filter(f => f.type.startsWith("audio/"))
      .map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      }));
    setSounds((prev) => [...prev, ...newSounds]);
    // reset input pour permettre réimport du même dossier si besoin
    e.target.value = "";
  };

  const handleDragStart = (e, sound) => {
    e.dataTransfer.setData("audio/url", sound.url);
    e.dataTransfer.setData("audio/name", sound.name);
  };

  // évite les fuites d’URL
  useEffect(() => {
    return () => {
      sounds.forEach(s => URL.revokeObjectURL(s.url));
    };
  }, [sounds]);

  return (
    <div className="w-full h-full p-2 overflow-auto flex flex-col">
      <label className=" mb-2 text-sm font-bold">Sound Browser</label>

      <input
        type="file"
        accept="audio/*"
        multiple
        directory=""
        webkitdirectory=""
        onChange={handleFiles}
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex flex-row bg-gray-800 p-2 rounded mt-2">
        {sounds.map((sound, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, sound)}
            className="p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-move"
            title="Glisser sur un canal du DrumRack"
          >
            <p className="text-xs truncate">{sound.name}</p>
            <audio src={sound.url} controls className="w-full mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniBrowser;
