// memoizedHandlers.js
import { useMemo } from "react";

export const useMemoizedHandlers = ({
  handleMouseEnter,
  handleMouseLeave,
  handleColsChange,
  handleSamplesUpdated,
  handleUrlUpdated,
  handleChannelsUpdated,
  handleGridsUpdated,
  handlePatternsUpdated,
}) => {
  return useMemo(() => ({
    mouse: {
      onPatternMouseEnter: () => handleMouseEnter("Add / Delete / Duplicate patterns"),
      onPlaylistMouseEnter: () => handleMouseEnter("Playlist"),
      onTransportMouseEnter: () => handleMouseEnter("Transport"),
      onBrowserMouseEnter: () => handleMouseEnter("Sound Browser"),
      onNewProjectMouseEnter: () => handleMouseEnter("New Project"),
      onSaveProjectMouseEnter: () => handleMouseEnter("Save Project"),
      onLoadProjectMouseEnter: () => handleMouseEnter("Load Project"),
      onSettingsMouseEnter: () => handleMouseEnter("Settings"),
      onMouseLeave: handleMouseLeave,
    },
    callbacks: {
      handleColsChange,
      handleSamplesUpdated,
      handleUrlUpdated,
      handleChannelsUpdated,
      handleGridsUpdated,
      handlePatternsUpdated,
    }
  }), [
    handleMouseEnter,
    handleMouseLeave,
    handleColsChange,
    handleSamplesUpdated,
    handleUrlUpdated,
    handleChannelsUpdated,
    handleGridsUpdated,
    handlePatternsUpdated,
  ]);
};
