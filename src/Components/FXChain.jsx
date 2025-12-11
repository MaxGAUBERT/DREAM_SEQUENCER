import { useRef, useEffect } from "react";
import { useProjectStorage } from "../Hooks/Storage/useProjectStorage";
import useFXChain from "../Hooks/DrumRack/useFXChain";
import * as Tone from "tone";
import { usePlayContext } from "../Contexts/PlayContext";
import { IoClose } from "react-icons/io5";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";
import { useSampleContext } from "../Contexts/ChannelProvider";

const FXChain = ({instrumentList, setInstrumentList, onClose}) => {
  const slotRefs = useRef({});
  const {volume} = usePlayContext();
  const {updateInstrumentSlot} = useProjectStorage()
  const { slots, selectedSlot, setSelectedSlot, fxParams } = useFXChain();
  const {colorsComponent} = useGlobalColorContext();
  const {getSampler} = useSampleContext();

  const getChannelAtSlot = (slotNumber) => {
    const entries = Object.entries(instrumentList || {});
    const entry = entries.find(
      ([, { slot }]) => Number(slot) === Number(slotNumber)
    );
    return entry?.[0] || null;
  };

  function applyFXChainToInstrument(instrument, fxName) {
    const instrumentName = selectedSlot.channel;
    const samplerNode = getSampler(instrumentName);

    if (!samplerNode) return;

    // Create volume node if needed
    if (!instrument.volumeNode) {
      instrument.volumeNode = new Tone.Volume(0);
    }

    // Disconnect sampler from any previous routing
    samplerNode.disconnect();

    // NO FX
    if (!fxName || fxName === "-- Select an effect --") {
      instrument.volumeNode.disconnect();
      instrument.volumeNode.toDestination();

      samplerNode.connect(instrument.volumeNode);

      setInstrumentList(prev => ({
        ...prev,
        [instrumentName]: { ...instrument, fx: null }
      }));
      return;
    }

    // CREATE FX
    let fxNode;
    switch (fxName) {
      case "Reverberator":
        fxNode = new Tone.Reverb({
          decay: fxParams[fxName].decay,
          wet: fxParams[fxName].wet
        });
        break;

      case "Hypno Chorus":
        fxNode = new Tone.Chorus({
          rate: fxParams[fxName].rate,
          depth: fxParams[fxName].depth,
          feedback: fxParams[fxName].feedback
        }).start();
        break;

      case "Super Delay":
        fxNode = new Tone.FeedbackDelay({
          delayTime: fxParams[fxName].delayTime,
          feedback: fxParams[fxName].feedback
        });
        break;

      case "Complex Distortion":
        fxNode = new Tone.Distortion({
          distortion: fxParams[fxName].distortion,
          oversample: fxParams[fxName].oversample
        });
        break;
    }

    // ROUTING
    instrument.volumeNode.disconnect();
    instrument.volumeNode.connect(fxNode);
    fxNode.toDestination();

    samplerNode.connect(instrument.volumeNode);

    // Update state
    setInstrumentList(prev => ({
      ...prev,
      [instrumentName]: {
        ...instrument,
        fx: fxName,
        fxNode
      }
    }));
  }

  const handleApplyFX = (e, assignedChannel) => {
  const selectedFX = e.target.value;

  setInstrumentList(prev => {
    const updatedInstrument = {
      ...prev[assignedChannel],
      fx: selectedFX
    };

    applyFXChainToInstrument(updatedInstrument, selectedFX);

    return {
      ...prev,
      [assignedChannel]: updatedInstrument
    };
  });
  };

  useEffect(() => {
    if (selectedSlot.channel !== null) {
      console.log("✅ selectedSlot mis à jour :", selectedSlot, instrumentList[selectedSlot.channel].fx);
      console.log("Volume pour cet instru:", volume);
    }
  }, [selectedSlot, instrumentList]);

  useEffect(() => {
    console.log("🎛 FX actuel :", instrumentList[selectedSlot.channel]?.fx);
  }, [instrumentList]);


  const handleSlotClick = (slotNumber) => {
    const assignedChannel = getChannelAtSlot(slotNumber);
    setSelectedSlot({ channel: assignedChannel, slot: slotNumber });
  };

  return (
    <div style={{ color: colorsComponent.Text, backgroundColor: colorsComponent.Background }} className="relative gap-10 scrollbar-custom w-full h-full overflow-auto shadow-lg flex flex-col">
      <div>
        <button
          onClick={onClose}
          title="Close Playlist"
          className="left-0 mt-1 absolute bg-gray-800 hover:bg-gray-700 rounded ml-4 transition-colors">

          <IoClose size={15} />
      </button>
      </div>
      <label className="text-sm sticky left-0 bg-gray-800 font-semibold px-2">
        {getChannelAtSlot(selectedSlot.slot) || "All Channels"}
      </label>

      <div className="flex flex-row gap-4" ref={slotRefs}>
        {slots.map((s) => {
          const assignedChannel = getChannelAtSlot(s);
          const isSelected = selectedSlot.slot === s;
          const isSlotOccupied = !!assignedChannel;

          return (
            <div
              key={`slot-${s}`}
              className={`flex flex-col p-2 rounded shadow-md w-[120px] transition-all duration-150 border-2
                ${isSlotOccupied ? "bg-green-700 border-green-500" : "bg-gray-800 border-gray-600"}
                ${isSelected ? "border-blue-400" : ""}
              `}
              onClick={() => handleSlotClick(s)}
            >
              <label className="text-sm mb-2 font-semibold">
                {s===0 ? "" : assignedChannel || "All Channels"}
              </label>
              <p className="text-sm mb-2 font-semibold">
                {s === 0 ? "Master" : `Insert ${s}`}
              </p>

              <select
                className="w-full bg-gray-900 text-white text-sm p-1 rounded mb-2"
                disabled={!assignedChannel}
                value={instrumentList[s]?.fx}
                onChange={(e) => handleApplyFX(e, assignedChannel)}
              >

                <option>-- Select an effect --</option>
                <option>Reverberator</option>
                <option>Hypno Chorus</option>
                <option>Super Delay</option>
                <option>Complex Distortion</option>
              </select>

              <input
                type="range"
                min="0"
                max="50"
                defaultValue="0"
                value={selectedSlot.volume}
                className="h-50 w-[200px] rotate-[-90deg] mt-4"
                disabled={!assignedChannel}
                onClick={(e) => {
                  e.stopPropagation();
                  if (assignedChannel){
                    updateInstrumentSlot(assignedChannel, s);
                  }
                }}
                onChange={(e) => {
                    if (!assignedChannel) return;

                    const value = Number(e.target.value); // 0 → 50
                    
                    setInstrumentList(prev => {
                      const inst = prev[assignedChannel];
                      if (!inst?.volumeNode) return prev;

                
                      inst.volumeNode.volume.value = value - 50; 

                      return {
                        ...prev,
                        [assignedChannel]: {
                          ...inst,
                          volume: value
                        }
                      };
                    });
                  }}

              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FXChain;
