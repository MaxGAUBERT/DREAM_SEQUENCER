import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Divider, Input } from '@mui/material';
import * as Tone from 'tone';
import PluginViewer from './pluginViewer'; // Assurez-vous que ce chemin est correct
import { useHoverInfo } from '../Contexts/HoverInfoContext';
const SoundBrowser = (props) => {
  const { createHoverProps } = useHoverInfo();
  const [samples, setSamples] = useState([]);
  const [viewPlugins, setViewPlugins] = useState(false);
  const [pluginData, setPluginData] = useState([
          {
              name: "MODULATOR",
              description: "FM Synthesizer",
              icon: "icon1.png",
          },
          {
              name: "Classic Tone",
              description: "Analog Synthesizer",
              icon: "icon2.png",
          },
          {
              name: "WAVEFORMER",
              description: "Wavetable Synthesizer",
              icon: "icon3.png",
          }
  ]);

  const handleFolderSelect = (e) => {
    const files = Array.from(e.target.files).filter(file =>
      file.type.startsWith('audio/')
    );

    const sampleList = files.map(file => ({
      name: file.name,
      file,
      url: URL.createObjectURL(file),
    }));

    setSamples(sampleList);
  };


  const handlePreview = async (url) => {
    try {
      await Tone.start(); // Nécessaire pour autoriser le son
      const player = new Tone.Player(url).toDestination();
      
      player.onstop = () => {
        player.dispose();
      };
      
      player.autostart = true;

      // Détruire après lecture
      setTimeout(() => {
        if (player && !player.disposed) {
          player.dispose();
        }
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la lecture du son:", error);
    }
  };

  const handleDragStart = (e, sample) => {
  // Créer un objet avec toutes les données nécessaires
  const dragData = {
    type: 'sample',
    name: sample.name,
    url: sample.url,
    file: sample.file,
    id: `sample_${Date.now()}_${Math.random()}` // ID unique pour éviter les conflits
  };
  
  // Stocker les données sous différents formats pour assurer la compatibilité
  e.dataTransfer.setData("application/json", JSON.stringify(dragData));
  e.dataTransfer.setData("text/plain", sample.url);
  e.dataTransfer.setData("text/sample-data", JSON.stringify(dragData));
  
  // Définir l'effet de drag
  e.dataTransfer.effectAllowed = "copy";
  
  // Optionnel: créer une image de drag personnalisée
  e.dataTransfer.setDragImage(e.target, 0, 0);
  
  console.log("Drag started with sample:", dragData);
};

  return (
    <div
      className="bg-1e1e1e color-white fixed top-12 bg-gray-800 left-0 max-h-180 h-full w-88.5 z-1000 overflow-y-auto"
      
    >



        <button
          variant="contained"
          width="10%"
          className="mt-5 bg-#555 text-white hover:bg-gray-600  hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out"
          onClick={() => document.getElementById("folderInput").click()}
          {...createHoverProps("Import Samples")}
        >
          Import Samples
        </button>

        <button
          variant="contained"
          width="10%"
          className="mb-2 ml-2 bg-#555 text-white hover:bg-gray-600  hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out"
          onClick={() => setViewPlugins(!viewPlugins)}
          {...createHoverProps("View Plugins")}
        >

          View Plugins
        </button>
      <input
        id="folderInput"
        type="file"
        webkitdirectory=""
        directory="true"
        multiple="true"
        className='hidden'
        onChange={handleFolderSelect}
      />

      {/* Divider */}
      <div className="border-b border-gray-600 mb-4"></div>

      {/* List */}
      <div>
        {samples.map((sample, index) => (
          <div
            key={index}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, sample)}
            onDragOver={(e) => handleDragOver(e, sample)}
            className="cursor-grab hover:bg-gray-700 hover:rounded"
          >
            <div className="flex justify-between items-center bg-gray-800 mb-2 rounded-lg px-2 py-3">
              <div className="text-white overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-4">
                {sample.name}
              </div>
              <button
                {...createHoverProps("Preview sample")}
                onClick={() => handlePreview(sample.url)}
                className="text-sm px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-600 rounded"
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

    {/* Empty state */}
    {samples.length === 0 && (
      <div className="text-gray-400 text-center mt-8 text-sm">
        No samples loaded
      </div>
    )}

      {viewPlugins && (
       
        <PluginViewer plugin={pluginData} onClose={() => setViewPlugins(false)} />

      )}

    </div>
  );
};

export default SoundBrowser;
