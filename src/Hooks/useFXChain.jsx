import { useState } from "react";



export const useFXChain = () => {
    const numOfSlots = 30;
    const createSlots = () => Array.from({ length: numOfSlots }, (_, i) => i);
    const [slots] = useState(createSlots());
    const [selectedSlot, setSelectedSlot] = useState({
        channel: null,
        slot: 1
    });


    return (
        {slots, selectedSlot, setSelectedSlot, numOfSlots}
    )
}

export default useFXChain;


