import React, { useState, useEffect } from 'react';
import { useSoundBank } from '../../Hooks/useSoundBank';

const ChannelModal = ({ onClose, instrumentList, setInstrumentList, instrumentName, setInstrumentName, onRename, onSelectSample, channelUrl, onOpenPianoRoll}) => {
  const [activeTab, setActiveTab] = useState("General");
  const [localName, setLocalName] = useState(instrumentName);
  const [selectedSoundId, setSelectedSoundId] = useState(null);

  const {
    audioObjects, 
    soundBank: bank
  } = useSoundBank();

  // Synchroniser avec le nom de l'instrument quand il change
  useEffect(() => {
    setLocalName(instrumentName);
  }, [instrumentName]);

  function cleanSampleName(filePath, maxLength) {
    if (!filePath) return "";

    // Étape 1 : extraire le nom du fichier (sans dossier)
    const fileName = filePath.split("/").pop() || filePath;

    // Étape 2 : retirer l'extension
    const noExtension = fileName.replace(/\.[^/.]+$/, "");

    // Étape 3 : remplacer les underscores ou tirets par des espaces
    const readable = noExtension.replace(/[_\-]+/g, " ");

    // Étape 4 : tronquer si trop long
    return readable.length > maxLength
      ? readable.slice(0, maxLength).trim() + "..."
      : readable;
  }

  // CORRECTION : Fonction handleSave corrigée
  const handleSave = () => {
    // Renommer le canal
    if (onRename) {
      onRename(localName);
    } else if (setInstrumentName) {
      setInstrumentName(localName);
    }

    // Attribuer un sample si sélectionné
    if (onSelectSample && selectedSoundId && audioObjects[selectedSoundId]) {
      const soundObject = audioObjects[selectedSoundId];
      const rawPath = soundObject.soundData.url;
      const displayName = cleanSampleName(rawPath, 20);

      // Créer l'objet sample avec les bonnes propriétés
      const sampleData = {
        id: selectedSoundId,
        url: rawPath, // URL directe du sample
        name: displayName
      };

      // Appeler onSelectSample avec les bons paramètres
      onSelectSample(sampleData, instrumentName);
    }

    //onClose();
  };

  const handleCancel = () => {
    // Remettre la valeur originale
    setLocalName(instrumentName);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleOpenPianoRoll = () => {
    onOpenPianoRoll(instrumentName);
    onClose();
  };

  const handleSetFxSlot = (instrumentName, slotNumber) => {
    if (!instrumentName) return;
    setInstrumentList(prev => {
      const instrument = prev[instrumentName];
      if (!instrument) return prev;
      return {
        ...prev,
        [instrumentName]: {
          ...instrument,
          slot: slotNumber
        }
      };
    });
    console.log(`Slot ${slotNumber} selected for instrument ${instrumentName}`);
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "General":
        return (
           <div>
            <p>
              Channel properties
            </p>
            <label className="block text-sm text-red-600 font-medium mb-2">
              Sample url: {channelUrl}
            </label>
            <label className="block text-sm text-gray-600 font-medium mb-2">
              Rename {instrumentName}
            </label>
            <input
              type="text"
              placeholder="Rename channel"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className='w-full mt-2'>
              <label className="block text-sm text-gray-600 font-medium mb-2">
                Assign a sample
              </label>
            <select
              className="w-full px-4 py-2 text-white bg-gray-500 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSoundId || ""}
              onChange={(e) => setSelectedSoundId(e.target.value)}
            >
              <option value="">-- Select --</option>
              {Object.entries(audioObjects).map(([soundId, soundObj]) => (
                <option key={soundId} value={soundId}>
                  {soundObj.name}
                </option>
              ))}
            </select>
            
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleOpenPianoRoll}
            >
              PianoRoll
            </button>
            

            </div>
          </div>
        );
      case "Effects":
        return (
          <div className="text-white">
            <p>Assign channels to FX slots</p>
            <input
              type='number'
              value={instrumentList[instrumentName].slot}
              min={0}
              max={200}
              onChange={(e) => handleSetFxSlot(instrumentName, Number(e.target.value))}
              className="w-20 mt-5 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      case "Advanced":
        return (
          <div className="text-white">
            <p>Advanced settings</p>
            {/* Ajoute ici les options avancées */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl text-white font-bold mb-4">{instrumentName}</h2>

        {/* Tabs */}
        <div className="flex space-x-4 mb-4 border-b border-gray-700">
          {["General", "Effects", "Advanced"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-white ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <form className="mb-4">{renderTabContent()}</form>

        {/* Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-4 py-2"
          >
            Cancel
          </button>
        </div>

        

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
  );
};

export default ChannelModal;