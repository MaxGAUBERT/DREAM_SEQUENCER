import { useState } from "react";

export function usePatternManager (){

    const initLength = 8;
    const INITIAL_PATTERN_ID = 0;

    function getColorByIndex(i) {
        const colors = [
            "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
            "bg-pink-500", "bg-purple-500", "bg-orange-500", "bg-teal-500",
        ];
        return colors[i % colors.length];
    }
    
    const [patterns, setPatterns] = useState(() =>
        Array.from({ length: initLength }, (_, i) => ({
        id: i, 
        name: `Pattern ${i + 1}`,
        color: getColorByIndex(i),
        grid: Array(16).fill(false), 
        pianoData: []              
        }))
    );
    
    
    const [selectedPatternID, setSelectedPatternID] = useState(INITIAL_PATTERN_ID);


    return {
        patterns, setPatterns, 
        selectedPatternID, setSelectedPatternID,
        getColorByIndex
    }
}

export default usePatternManager;