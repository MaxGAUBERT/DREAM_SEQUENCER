import {Box, TextField} from "@mui/material";
import { useCallback, useState } from "react";



export const usePattern = ({
  patterns,
  selectedPattern,
  setPatterns, setSelectedPattern, players, channelSources, grids, rows, cols, setGrids
}) => {

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
      name: `Pattern ${newId}`,
    };

    setPatterns([...patterns, newPattern]);
    setSelectedPattern(newPattern);
    setGrids(instrumentGrids);
  }, [patterns, setPatterns, setSelectedPattern, players, channelSources, rows, cols, setGrids]);

  const deletePattern = useCallback(() => {
    if (!selectedPattern || Object.keys(players).length === 0) return;

    setPatterns(prevPatterns => {
      if (prevPatterns.length === 1) return prevPatterns;

      const updatedPatterns = prevPatterns.filter(p => p.id !== selectedPattern.id);
      const reindexedPatterns = updatedPatterns.map((pattern, index) => ({
        ...pattern,
        id: index + 1,
        name: pattern.name
      }));

      const deletedIndex = prevPatterns.findIndex(p => p.id === selectedPattern.id);
      const newSelected = reindexedPatterns[Math.min(deletedIndex, reindexedPatterns.length - 1)];
      setSelectedPattern(newSelected);

      return reindexedPatterns;
    });
  }, [selectedPattern, players, setPatterns, setSelectedPattern]);

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
      //name: `Pattern ${newId}`,
      name: selectedPattern.name,
      grids: deepCopyGrids,
    };

    setPatterns(prev => [...prev, newPattern]);
    setSelectedPattern(newPattern);
    setGrids(deepCopyGrids);
  }, [selectedPattern, patterns, players, grids, setPatterns, setSelectedPattern, setGrids]);

  const renamePattern = useCallback((newName) => {
    if (!selectedPattern) return;

    setPatterns(prev => 
      prev.map(p => p.id === selectedPattern.id ? {...p, name: newName}: p

      ),

    )

    setSelectedPattern(prev => 
      prev ? {...prev, name: newName}: null
    );
  },[selectedPattern, setPatterns, setSelectedPattern]);

  return { addPattern, deletePattern, renamePattern, duplicatePattern };
};

