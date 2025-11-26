import { useGlobalColorContext } from "../../Contexts/GlobalColorContext";
import { MdDeleteSweep } from "react-icons/md";


export default function DeleteAllPatterns ({patterns, setPatterns, setInstrumentList, onSelect}) {
    const {colorsComponent} = useGlobalColorContext();

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
        <div className="flex items-center">
         {patterns.length > 1 && (
            <button 
            onClick={handleDeleteAllPatterns}
            className="w-15 h-15 rounded-full border-4 transition-all duration-150 ease-in-out"
            style={{ backgroundColor: "black", borderColor: colorsComponent.Border }}  
            title="Delete all patterns"      
            >
            <MdDeleteSweep size={25}/>
            </button>
        )}
      </div>

    )
    
}