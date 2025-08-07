import { useState } from "react";



export const useFXChain = () => {
    const numOfSlots = 30;
    const createSlots = () => Array.from({ length: numOfSlots }, (_, i) => i);
    const [slots] = useState(createSlots());
    const [selectedSlot, setSelectedSlot] = useState({
        channel: null,
        slot: 1
    });
    const [fxParams, setFXParams] = useState({
        "Reverberator": { decay: 2.5, wet: 1 },
        "Hypno Chorus": { rate: 4, depth: 2.5, feedback: 0.5 },
        "Super Delay": { delayTime: "8n", feedback: 0.5 },
    });


    return (
        {slots, selectedSlot, setSelectedSlot, numOfSlots, fxParams, setFXParams}
    )
}

export default useFXChain;


