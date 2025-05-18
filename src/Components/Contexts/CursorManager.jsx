import React, { useState, useContext } from 'react';
import { createContext } from 'react';


export const CursorManagerContext = createContext({
    cursor: null,
    setCursor: () => {},
});

export const useCursorManager = () => useContext(CursorManagerContext);
export const CursorManagerProvider = ({ children }) => {
    const [cursor, setCursor] = useState("default");

    return (
        <CursorManagerContext.Provider value={{ cursor, setCursor }}>
            {children}
        </CursorManagerContext.Provider>
    );
};