import React, { useState, useEffect, useRef, useCallback } from "react";

const MiniBrowser = () => {
  const [sounds, setSounds] = useState([]);
  // Map name → url pour pouvoir révoquer proprement
  const urlMapRef = useRef(new Map());

  // Révocation au démontage uniquement
  useEffect(() => {
    return () => {
      urlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlMapRef.current.clear();
    };
  }, []);

  const handleFiles = useCallback((e) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("audio/")
    );

    const newSounds = files.map((file) => {
      const url = URL.createObjectURL(file);
      urlMapRef.current.set(file.name + Date.now(), url);
      return { name: file.name, url };
    });

    setSounds((prev) => [...prev, ...newSounds]);
    e.target.value = "";
  }, []);

  const handleRemove = useCallback((url) => {
    URL.revokeObjectURL(url);
    setSounds((prev) => prev.filter((s) => s.url !== url));
  }, []);

  const handleDragStart = useCallback((e, sound) => {
    e.dataTransfer.setData("audio/url", sound.url);
    e.dataTransfer.setData("audio/name", sound.name);
  }, []);

  return (
    <div className="w-full p-2 flex flex-col gap-2">
      <span className="text-sm font-bold text-gray-300">Sound Browser</span>

      <input
        type="file"
        accept="audio/*"
        multiple
        // @ts-ignore — attributs non-standard supportés par Chrome/Edge
        directory=""
        webkitdirectory=""
        onChange={handleFiles}
        className="w-full px-3 py-1 text-sm border border-gray-600 rounded bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {sounds.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          Importez des samples puis glissez-les sur un canal.
        </p>
      )}

      <div className="flex flex-wrap gap-2 bg-gray-800 p-2 rounded">
        {sounds.map((sound) => (
          <div
            key={sound.url}
            draggable
            onDragStart={(e) => handleDragStart(e, sound)}
            className="relative p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-move group"
            title="Glisser sur un canal"
          >
            <button
              onClick={() => handleRemove(sound.url)}
              className="absolute top-1 right-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              title="Retirer"
            >
              ✕
            </button>
            <p className="text-xs truncate max-w-[120px]">{sound.name}</p>
            <audio src={sound.url} controls className="mt-1" style={{ width: 160, height: 28 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(MiniBrowser);