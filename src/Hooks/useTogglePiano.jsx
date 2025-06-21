import { useState } from "react";



export function useTogglePiano() {
    const [isPianoOpen, setIsPianoOpen] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState(null);


    return {isPianoOpen, setIsPianoOpen, selectedInstrument, setSelectedInstrument};
}