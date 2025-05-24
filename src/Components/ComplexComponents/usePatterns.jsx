// ComplexComponents/Functions/usePatterns.js
import { useCallback } from "react";

export function usePatterns({
  patterns,
  setPatterns,
  selectedPattern,
  setSelectedPattern,
  channelSources,
  players,
  setGrids,
  grids,
  rows,
  cols
}) {
  const addPattern = useCallback(() => {
    if (!Object.keys(players).length) return;

    const newId = patterns.length + 1;
    const instrumentGrids = {};

    Object.keys(channelSources).forEach(instrumentName => {
      instrumentGrids[instrumentName] = Array.from({ length: rows }, () => Array(cols).fill(false));
    });

    const newPattern = {
      players: { ...channelSources },
      grids: instrumentGrids,
      id: newId,
      name: `Pattern ${newId}`
    };

    setPatterns(prev => [...prev, newPattern]);
    setSelectedPattern(newPattern);
    setGrids(instrumentGrids);
  }, [players, channelSources, patterns, rows, cols, setPatterns, setSelectedPattern, setGrids]);

  const duplicatePattern = useCallback(() => {
    if (!selectedPattern || Object.keys(players).length === 0) return;

    const newId = patterns.length + 1;
    const deepCopyGrids = {};

    Object.keys(grids).forEach(instrumentId => {
      deepCopyGrids[instrumentId] = grids[instrumentId].map(row => [...row]);
    });

    const newPattern = {
      ...selectedPattern,
      id: newId,
      name: `Pattern ${newId}`,
      grids: deepCopyGrids
    };

    setPatterns(prev => [...prev, newPattern]);
    setSelectedPattern(newPattern);
    setGrids(deepCopyGrids);
  }, [selectedPattern, players, patterns, grids, setPatterns, setSelectedPattern, setGrids]);

  const deletePattern = useCallback(() => {
    if (!selectedPattern || Object.keys(players).length === 0) return;

    setPatterns(prevPatterns => {
      if (prevPatterns.length === 1) return prevPatterns;

      const updatedPatterns = prevPatterns.filter(p => p.id !== selectedPattern.id);
      const reindexed = updatedPatterns.map((pattern, index) => ({
        ...pattern,
        id: index + 1,
        name: `Pattern ${index + 1}`
      }));

      const deletedIndex = prevPatterns.findIndex(p => p.id === selectedPattern.id);
      const newSelected = reindexed[Math.min(deletedIndex, reindexed.length - 1)];
      setSelectedPattern(newSelected);

      return reindexed;
    });
  }, [selectedPattern, players, setPatterns, setSelectedPattern]);

  return {
    addPattern,
    duplicatePattern,
    deletePattern
  };
}
