import { useState } from "react";






export function useFXChain() {
    const [slotNumber, setSlotNumber] = useState(0);

    return {
        slotNumber,
        setSlotNumber
    }


}