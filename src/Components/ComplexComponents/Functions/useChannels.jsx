// useChannels.js
export const useChannels = ({
    setPlayers,
    setChannelSources,
    setGrids,
    setPatterns,
    selectedPattern,
}) => {
  const handleSamplesUpdated = (updatedPlayers) => setPlayers(updatedPlayers);

  const handleChannelsUpdated = (updatedChannels) => setPlayers(updatedChannels);

  const handleUrlUpdated = (updatedUrl) => setChannelSources(updatedUrl);

  const handlePatternsUpdated = (updatedPatterns) => setPatterns(updatedPatterns);

  const handleGridsUpdated = (updatedGrids) => {
    setGrids(updatedGrids);

    setPatterns((prevPatterns) =>
      prevPatterns.map((pattern) =>
        pattern.id === selectedPattern?.id
          ? { ...pattern, grids: updatedGrids }
          : pattern
      )
    );
  };

  return {
    handleSamplesUpdated,
    handleChannelsUpdated,
    handleUrlUpdated,
    handlePatternsUpdated,
    handleGridsUpdated,
  };
};
