// UI/Modals/ChannelModal.jsx
// Adapté à l'interface du store refactorisé :
// - onRename(newName)           → store.renameInstrument(activeInstrument, newName)
// - onSelectSample(name, url, displayName) → store.selectSample(...)
// Plus de setInstrumentName prop.
import { useState, useEffect } from 'react';
import { useSoundBank } from '../../Hooks/Samples/useSoundBank';
import { useFXChain } from '../../Hooks/DrumRack/useFXChain';
import { useProjectStorage } from '../../Hooks/Storage/useProjectStorage';
import { useDrumRackStore } from '../../store/useDrumRackStore';

function cleanSampleName(filePath, maxLength = 30) {
  if (!filePath) return "";
  const fileName    = filePath.split("/").pop() ?? filePath;
  const noExtension = fileName.replace(/\.[^/.]+$/, "");
  const readable    = noExtension.replace(/[_\-]+/g, " ");
  return readable.length > maxLength
    ? readable.slice(0, maxLength).trim() + "…"
    : readable;
}

const TABS = ["General", "Effects", "Advanced"];

const ChannelModal = ({
  onClose,
  instrumentName,   // nom du canal actif (string)
  onRename,         // (newName: string) => void
  onSelectSample,   // (instrumentName, url, displayName) => void
  onOpenPianoRoll,  // (instrumentName) => void
}) => {
  const [activeTab,      setActiveTab]      = useState("General");
  const [localName,      setLocalName]      = useState(instrumentName);
  const [selectedSoundId, setSelectedSoundId] = useState(null);

  const { audioObjects }                        = useSoundBank();
  const { selectedSlot }                        = useFXChain();
  const { resetSampleForInstrument } = useProjectStorage();
  const currentChannelUrl = useDrumRackStore(
    (s) => s.instrumentList[instrumentName]?.sampleUrl
  );

  // Sync si le canal actif change pendant que la modal est ouverte
  useEffect(() => { setLocalName(instrumentName); }, [instrumentName]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleSave = () => {
    // 1. Renommage
    const trimmed = localName.trim();
    if (trimmed && trimmed !== instrumentName && onRename) {
      onRename(trimmed);                        // ← 1 seul argument
    }

    // 2. Sample sélectionné dans la banque
    if (selectedSoundId && audioObjects[selectedSoundId] && onSelectSample) {
      const soundObj    = audioObjects[selectedSoundId];
      const displayName = cleanSampleName(soundObj.url ?? soundObj.name);
      onSelectSample(instrumentName, soundObj.url, displayName); // ← (name, url, display)
    }

    onClose();
  };

  const handleReset = () => {
    resetSampleForInstrument(instrumentName);
    setSelectedSoundId(null);
    onClose();
  };

  const handleCancel = () => {
    setLocalName(instrumentName);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")  handleSave();
    if (e.key === "Escape") handleCancel();
  };

  const handleOpenPianoRoll = () => {
    onOpenPianoRoll?.(instrumentName);
    onClose();
  };

  // ── Onglets ──────────────────────────────────────────────────────────────

  const currentSampleUrl =
    selectedSoundId && audioObjects[selectedSoundId]
      ? audioObjects[selectedSoundId].url
      : currentChannelUrl;

  const renderTabContent = () => {
    switch (activeTab) {
      case "General":
        return (
          <div className="flex flex-col gap-4">
            {/* Sample actif */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Sample actuel</p>
              <p className="text-sm text-red-400 break-all">
                {currentSampleUrl ?? "Aucun sample"}
              </p>
            </div>

            {/* Renommage */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Renommer <span className="text-white font-semibold">{instrumentName}</span>
              </label>
              <input
                type="text"
                placeholder="Nom du canal"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                autoFocus
                maxLength={30}
              />
            </div>

            {/* Sélection sample depuis la banque */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Assigner un sample (banque)
              </label>
              <select
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSoundId ?? ""}
                onChange={(e) => setSelectedSoundId(e.target.value || null)}
              >
                <option value="">-- Sélectionner --</option>
                {Object.entries(audioObjects).map(([id, obj]) => (
                  <option key={id} value={id}>
                    {obj.name ?? cleanSampleName(obj.url)}
                  </option>
                ))}
              </select>
            </div>

            {/* Piano Roll */}
            <button
              type="button"
              onClick={handleOpenPianoRoll}
              className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Ouvrir Piano Roll
            </button>
          </div>
        );

      case "Effects":
        return (
          <div className="text-white">
            <p className="mb-4 text-gray-400">Assigner le canal aux slots FX</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Slots FX — à implémenter */}
            </div>
          </div>
        );

      case "Advanced":
        return (
          <div className="text-white">
            <p className="text-gray-400">Paramètres avancés</p>
            {/* À implémenter */}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
      {/* Titre */}
      <h2 className="text-2xl text-white font-bold mb-4">{instrumentName}</h2>

      {/* Bouton fermeture */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        aria-label="Fermer"
      >
        ✕
      </button>

      {/* Onglets */}
      <div className="flex gap-4 mb-4 border-b border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-white font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      <div className="mb-6">{renderTabContent()}</div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Enregistrer
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Réinitialiser
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default ChannelModal;