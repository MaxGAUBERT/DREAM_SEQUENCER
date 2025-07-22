import React, { useState, useEffect } from "react";
import { BiRename } from "react-icons/bi";

export default function RenamePattern({ patterns, setPatterns, selectedPatternID }) {
    const [renameInput, setRenameInput] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        if (renameInput && selectedPatternID !== null) {
            const selectedPattern = patterns.find(p => p.id === selectedPatternID);
            if (selectedPattern) {
                setNewName(selectedPattern.name);
            }
        }
    }, [renameInput, selectedPatternID, patterns]);

    const handleInputChange = (e) => {
        setNewName(e.target.value);
    };

    const handleRenameSubmit = () => {
        if (!selectedPatternID || !newName.trim()) return;

        setPatterns(prev =>
            prev.map(pattern =>
                pattern.id === selectedPatternID
                    ? { ...pattern, name: newName.trim() }
                    : pattern
            )
        );
        setRenameInput(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleRenameSubmit();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                className="w-15 h-15 rounded-full border-4 border-white transition-all duration-150 ease-in-out"
                style={{ backgroundColor: "black" }}
                onClick={() => setRenameInput(prev => !prev)}
                disabled={patterns.length <= 1}
                title="Rename pattern"
            >
                <BiRename size={25} />
            </button>

            {renameInput && (
                <input
                    type="text"
                    placeholder="New name"
                    className="w-30 px-2 py-1 rounded border-2 border-white text-white bg-black text-sm"
                    value={newName}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleRenameSubmit}
                    autoFocus
                />
            )}
        </div>
    );
}
