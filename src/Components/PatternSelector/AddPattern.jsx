





export default function AddPattern ({onSelect, patterns, setPatterns, colorByIndex, setInstrumentList}) {

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


  return (
      <button 
        onClick={handleAddPattern}
        className="w-15 h-15 rounded-full border-4 border-white transition-all duration-150 ease-in-out"
        style={{ backgroundColor: "black" }}     
        title="Add pattern" 
      >
        +
      </button>
  )
}