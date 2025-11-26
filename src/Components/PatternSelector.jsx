import React, { useEffect } from "react";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";

const PatternSelector = React.memo(({ patterns, setPatterns, colorByIndex, initLength, onSelect, selectedPatternID, setInstrumentList }) => {
  const {colorsComponent} = useGlobalColorContext();
  
  useEffect(() => {
    if (patterns.length < initLength) {
      handleResetPatterns();
    }
  }, []);
  
  const handleAddPattern = () => {
    const newPattern = {
      id: patterns.length,
      name: `Pattern ${patterns.length + 1}`,
      color: colorByIndex(patterns.length),
    };

    setPatterns((prevPatterns) => [...prevPatterns, newPattern]);
    
    // Ajouter uniquement les grilles manquantes pour le nouveau pattern
    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        if (!newList[inst].grids) {
          newList[inst].grids = {};
        }
        // Ajouter seulement si la grille n'existe pas déjà
        if (!newList[inst].grids[newPattern.id]) {
          newList[inst].grids[newPattern.id] = Array(16).fill(false);
        }
      });
      return newList;
    });

    onSelect(newPattern.id);
  };

  const handleDeletePattern = (id) => {
    if (id === null || id === undefined || patterns.length <= 1) return;

    setPatterns((prevPatterns) => {
      const filteredPatterns = prevPatterns.filter((pattern) => pattern.id !== id);
      
      // Réindexer les patterns
      const reindexedPatterns = filteredPatterns.map((pattern, index) => ({
        ...pattern,
        id: index,
      }));

      return reindexedPatterns;
    });

    // Supprimer et réindexer les grilles correspondantes
    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        if (newList[inst].grids && newList[inst].grids[id] !== undefined) {
          // Créer un nouvel objet grids réindexé
          const newGrids = {};
          Object.keys(newList[inst].grids)
            .map(Number)
            .sort((a, b) => a - b)
            .forEach((oldId, newIndex) => {
              if (oldId !== id) {
                // Réindexer : si oldId > id, alors newIndex diminue de 1
                const finalIndex = oldId > id ? newIndex : oldId;
                newGrids[finalIndex] = newList[inst].grids[oldId];
              }
            });
          
          newList[inst].grids = newGrids;
        }
      });
      return newList;
    });

    // Ajuster la sélection si nécessaire
    if (id === selectedPatternID) {
      const newSelectedId = Math.max(0, Math.min(selectedPatternID, patterns.length - 2));
      onSelect(newSelectedId);
    } else if (id < selectedPatternID) {
      onSelect(selectedPatternID - 1);
    }
  };

  const handleResetPatterns = () => {
    const resetPatterns = Array.from({ length: initLength }, (_, i) => ({
      id: i,
      name: `Pattern ${i + 1}`,
      color: colorByIndex(i),
    }));
    
    setPatterns(resetPatterns);
    onSelect(0);
    
    // Préserver les données existantes et ajouter les grilles manquantes
    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        if (!newList[inst].grids) {
          newList[inst].grids = {};
        }
        
        // Ajouter seulement les grilles manquantes
        resetPatterns.forEach(pattern => {
          if (!newList[inst].grids[pattern.id]) {
            newList[inst].grids[pattern.id] = Array(16).fill(false);
          }
        });
        
        // Supprimer les grilles qui ne correspondent plus à aucun pattern
        const validPatternIds = resetPatterns.map(p => p.id);
        Object.keys(newList[inst].grids).forEach(gridId => {
          if (!validPatternIds.includes(Number(gridId))) {
            delete newList[inst].grids[gridId];
          }
        });
      });
      return newList;
    });
  };

  const handleDeleteAllPatterns = () => {
    setPatterns([]);
    onSelect(null);
    setInstrumentList(prev => {
      const newList = { ...prev };
      Object.keys(newList).forEach(inst => {
        newList[inst].grids = {};
      });
      return newList;
    });
  };

  return (
    <div className="flex gap-4 p-2 absolute bottom-0 border-4 w-screen overflow-auto border-gray-700">
      {patterns.map((pattern) => (
        <button
          key={pattern.id}
          onClick={() => onSelect(pattern.id)}
          className={`w-15 h-15 rounded-full border-4 transition-all duration-150 ease-in-out ${
            selectedPatternID === pattern.id ? "border-white" : "border-transparent"
          } ${pattern.color}`}
          title={pattern.name}
        >
          {pattern.id + 1}
        </button>
      ))}

      <button 
        onClick={handleAddPattern}
        className="w-15 h-15 rounded-full border-4 border-white transition-all duration-150 ease-in-out"
        style={{ backgroundColor: "black" }}      
      >
        +
      </button>

      <button 
        onClick={() => handleDeletePattern(selectedPatternID)}
        className="w-15 h-15 rounded-full border-4 border-white transition-all duration-150 ease-in-out"
        style={{ backgroundColor: "black"}}
        disabled={patterns.length <= 1}
      >
        -
      </button>
      
      {patterns.length > 1 && (
        <button 
          onClick={handleDeleteAllPatterns}
          className="w-20 h-15 rounded-full border-4 border-white transition-all duration-150 ease-in-out"
          style={{ backgroundColor: "black" }}        
        >
          Delete All
        </button>
      )}

      {patterns.length === 0 && (
        <button
          onClick={handleResetPatterns}
          className="w-20 h-15 text-center rounded-full border-4 border-white transition-all duration-150 ease-in-out"
          style={{ backgroundColor: colorsComponent.Button }}
        >
          Reset
        </button>
      )}
    </div>
  );
});

export default PatternSelector;