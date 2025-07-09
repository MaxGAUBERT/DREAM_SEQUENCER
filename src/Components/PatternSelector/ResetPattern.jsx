import { useEffect } from "react";
import { useGlobalColorContext } from "../../Contexts/GlobalColorContext";


export default function ResetPattern ({patterns, setPatterns, colorByIndex, initLength, onSelect, setInstrumentList}) {
    const {colorsComponent} = useGlobalColorContext();


    useEffect(() => {
        if (patterns.length < initLength) {
          handleResetPatterns();
        }
    }, []);

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

    return (
        <div>
            {patterns.length === 0 && (
            <button
                onClick={handleResetPatterns}
                className="w-20 h-15 text-center rounded-full border-4 border-white transition-all duration-150 ease-in-out"
                style={{ backgroundColor: colorsComponent.backgroundColor, color: "white" }}
                >
                Reset
            </button>
        )}
        </div>
    )
}