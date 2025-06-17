import React, { useState, useEffect } from 'react';
import { useSoundBank } from '../../Hooks/useSoundBank';

const ChannelModal = ({ onClose, instrumentName, setInstrumentName, onRename, onSelectSample}) => {
  const [activeTab, setActiveTab] = useState("General");
  const [localName, setLocalName] = useState(instrumentName);
  const [selectedSoundId, setSelectedSoundId] = useState(null);

  const {
    audioObjects, 
    loading, 
    playSound, 
    stopAllSounds,
    soundBank: bank 
  } = useSoundBank();

  // Synchroniser avec le nom de l'instrument quand il change
  useEffect(() => {
    setLocalName(instrumentName);
  }, [instrumentName]);

  const handleSave = () => {
    const trimmedName = localName.trim();
    
    // Validation basique
    if (trimmedName === '') {
      alert('Le nom du canal ne peut pas être vide');
      return;
    }
    
    // Appliquer le changement via les props
    if (onRename) {
      onRename(trimmedName);
    } else if (setInstrumentName) {
      setInstrumentName(trimmedName);
    }

    if (onSelectSample && selectedSoundId && audioObjects[selectedSoundId]) {
      const sampleUrl = audioObjects[selectedSoundId].soundData.url;
      onSelectSample(sampleUrl, selectedSoundId); // sampleUrl: string, soundId: string
    }

    
    onClose();
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "General":
        return (
           <div>
            <p>
              Channel properties
            </p>
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
            <div className='w-full'>
              <label className="block text-sm text-gray-600 font-medium mb-2">
                Select a sound
              </label>
            <select
              className="w-full px-4 py-2 text-white bg-gray-500 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSoundId || ""}
              onChange={(e) => setSelectedSoundId(e.target.value)}
            >
              <option value="">-- Choose a sample --</option>
              {Object.entries(audioObjects).map(([soundId, soundObj]) => (
                <option key={soundId} value={soundId}>
                  {soundObj.kitName} - {soundObj.name}
                </option>
              ))}
            </select>

            </div>
          </div>
        );
      case "Effects":
        return (
          <div className="text-white">
            <p>Assign channels to FX slots</p>
            {/* Ajoute ici tes contrôles d'effets */}
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
