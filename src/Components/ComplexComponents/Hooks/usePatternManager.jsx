// usePatternManager.js
import { useCallback, useEffect } from "react";

export const usePatternManager = ({
  patterns,
  setPatterns,
  selectedPattern,
  setSelectedPattern,
  players,
  channelSources,
  grids,
  setGrids,
}) => {
  const addPattern = useCallback(() => {
    if (!Object.keys(players).length) return;

    const newId = patterns.length + 1;
    const instrumentGrids = {};

    Object.keys(channelSources).forEach(instrumentName => {
      instrumentGrids[instrumentName] = Array.from({ length: grids.rows }, () => Array(grids.cols).fill(false));
    });

    const newPattern = {
      players: { ...channelSources },
      grids: instrumentGrids,
      id: newId,
      name: `Pattern ${newId}`,
    };

    setPatterns([...patterns, newPattern]);
    setSelectedPattern(newPattern);
    setGrids(structuredClone(newPattern.grids));


  }, [patterns, players, channelSources, setPatterns, setSelectedPattern, setGrids]);

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
      grids: deepCopyGrids,
    };

    setPatterns(prev => [...prev, newPattern]);
    setSelectedPattern(newPattern);
    setGrids(deepCopyGrids);
  }, [selectedPattern, patterns, players, grids, setPatterns, setSelectedPattern, setGrids]);

  const deletePattern = useCallback(() => {
    if (!selectedPattern || Object.keys(players).length === 0) return;

    setPatterns(prevPatterns => {
      if (prevPatterns.length === 1) return prevPatterns;

      const updatedPatterns = prevPatterns.filter(p => p.id !== selectedPattern.id);
      const reindexedPatterns = updatedPatterns.map((pattern, index) => ({
        ...pattern,
        id: index + 1,
        name: pattern.name,
      }));

      const deletedIndex = prevPatterns.findIndex(p => p.id === selectedPattern.id);
      const newSelected = reindexedPatterns[Math.min(deletedIndex, reindexedPatterns.length - 1)];
      setSelectedPattern(newSelected);
      setGrids(newSelected.grids || {});
      return reindexedPatterns;
    });
  }, [selectedPattern, players, setPatterns, setSelectedPattern, setGrids]);

  const handleSelectPattern = useCallback(
    (newSelectedPattern) => {
      if (selectedPattern?.id) {
        setPatterns(prevPatterns =>
          prevPatterns.map(pattern =>
            pattern.id === selectedPattern.id
              ? { ...pattern, grids: JSON.parse(JSON.stringify(grids)) }
              : pattern
          )
        );
      }

      setSelectedPattern(newSelectedPattern);
      if (newSelectedPattern?.grids) {
        setGrids(JSON.parse(JSON.stringify(newSelectedPattern.grids))); 
      } else {
        setGrids({});
      }
    },
    [selectedPattern, grids, setPatterns, setSelectedPattern, setGrids]
  );

  
    // Effet pour s'assurer qu'un pattern est sélectionné et que les grilles sont synchronisées
    useEffect(() => {
    if (patterns.length > 0) {
    const patternExists = patterns.some(p => p.id === (selectedPattern?.id || -1));
    if (!patternExists) {
        const firstPattern = patterns[0];
        setSelectedPattern(firstPattern);
        setGrids(firstPattern.grids || {});
    }
    } else {
    setSelectedPattern(null);
    setGrids({});
    }
    }, [patterns]);

  return {
    addPattern,
    duplicatePattern,
    deletePattern,
    handleSelectPattern,
  };
};