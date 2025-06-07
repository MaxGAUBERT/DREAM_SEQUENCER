import { useCallback } from "react";
import { useGridData } from "../../Contexts/GridData";
// useChannels.js
export const useChannels = ({
    setPlayers,
    setChannelSources,
    setPatterns,
    selectedPattern,
}) => {
  const {setGrids} = useGridData();
  const handleSamplesUpdated = useCallback((samples) => {
  console.log('🎵 Samples mis à jour dans Home:', samples);
  setPlayers(samples);
  
  // Mettre à jour le pattern actuel avec les nouveaux samples
  setPatterns(prev => prev.map(pattern => 
    pattern.id === selectedPattern 
      ? { ...pattern, players: samples }
      : pattern
  ));
}, [selectedPattern]);

  const handleChannelsUpdated = (updatedChannels) => setPlayers(updatedChannels);

  const handleUrlUpdated = (updatedUrl) => setChannelSources(updatedUrl);

  const handlePatternsUpdated = (updatedPatterns) => setPatterns(updatedPatterns);

  const handleGridsUpdated = (newGrids) => {
    
    setGrids(prev => {
      const updated = structuredClone(prev);
      updated[selectedPattern] = newGrids;
      return updated;
    });
    
    if (selectedPattern === null) {
      console.log('🎵 Grids mis à jour dans Home:', newGrids);
      return;
    }
    // Mettre à jour le pattern actuel avec les nouvelles grids
    setPatterns(prev => prev.map(pattern => 
      pattern.id === selectedPattern 
        ? { ...pattern, grids: newGrids }
        : pattern
    ));

    console.log('🎵 Grids mis à jour dans Home:', newGrids);
  }

  return {
    handleSamplesUpdated,
    handleChannelsUpdated,
    handleUrlUpdated,
    handlePatternsUpdated,
    handleGridsUpdated,
  };
};
