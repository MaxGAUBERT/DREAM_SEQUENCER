// SettingsContext.jsx
import { createContext, useContext, useState } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoSave: true,
    historyEnabled: true,
    bpm: 120,
    sampleRate: 44100,
    bufferSize: 256
  });

  const updateSetting = (key, value) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
