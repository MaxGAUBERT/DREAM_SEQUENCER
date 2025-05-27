import { useCallback, useEffect } from "react"




export const useTransport = ({
  stepValue,
  players,
  grids,
  setStepRow,
  onMouseEnter,
  onMouseLeave,
  setIsPlaying: setParentIsPlaying
}) => {


    const handlePlay = useCallback(() => {
        setParentIsPlaying(true);
    }, [setParentIsPlaying]);

    const handleStop = useCallback(() => {
        setParentIsPlaying(false);
    }, [setParentIsPlaying]);

    const handleChangeBPM = useCallback((value) => {
        setStepRow(value);
    }, [setStepRow]);

    


    return {
        handlePlay,
        handleStop,
        handleChangeBPM
    }
}