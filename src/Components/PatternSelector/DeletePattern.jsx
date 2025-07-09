




export default function DeletePattern ({patterns, setPatterns}) {
    
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

    return (
        <div className="flex items-center">
        <button 
            onClick={() => handleDeletePattern(selectedPatternID)}
            className="w-15 h-15 rounded-full border-4 border-white transition-all duration-150 ease-in-out"
            style={{ backgroundColor: "black"}}
            disabled={patterns.length <= 1}
        >
            -
        </button>
        </div>
    )
}
}