import { useRef, useEffect } from "react";
import { useProjectManager } from "../Hooks/useProjectManager";
import useFXChain from "../Hooks/useFXChain";
import * as Tone from "tone";
import { usePlayContext } from "../Contexts/PlayContext";
import { IoClose } from "react-icons/io5";
import { useGlobalColorContext } from "../Contexts/GlobalColorContext";

const FXChain = ({instrumentList, setInstrumentList, onClose}) => {
  const slotRefs = useRef({});
  const {updateInstrumentSlot} = useProjectManager()
  const { slots, selectedSlot, setSelectedSlot, fxParams, setFXParams } = useFXChain();
  const {colorsComponent} = useGlobalColorContext();

  const getChannelAtSlot = (slotNumber) => {
    const entries = Object.entries(instrumentList || {});
    const entry = entries.find(
      ([, { slot }]) => Number(slot) === Number(slotNumber)
    );
    return entry?.[0] || null;
  };

 
  function applyFXChainToInstrument(instrument, fxName) { 
  if (!instrument || !instrument.sampler) return;

  const sampler = instrument.sampler;
  const canConnect = typeof sampler.connect === "function";
  const canDisconnect = typeof sampler.disconnect === "function";

  // 🔹 Nettoyage de l'ancien FX
  if (instrument.fx) {
    try {
      if (canDisconnect) {
        sampler.disconnect();
      }
    } catch (e) {
      console.warn("Sampler disconnect failed:", e);
    }

    try {
      if (typeof instrument.fx.dispose === "function") {
        instrument.fx.dispose();
      }
    } catch (e) {
      console.warn("FX dispose failed:", e);
    }

    instrument.fx = null;
  } 

  // 🔹 Si aucun effet sélectionné → on quitte
  if (!fxName || fxName === "-- Select an effect --") {
    if (canConnect) {
      sampler.connect(Tone.Destination);
    }
    setInstrumentList(prev => ({
      ...prev,
      [selectedSlot.channel]: {
        ...prev[selectedSlot.channel],
        fx: null
      }
    }));
    return;
  }

  // 🔹 Création du nouvel effet
  let fxNode = null;

  switch (fxName) {
    case "Reverberator":
      fxNode = new Tone.Reverb({
        decay: fxParams[fxName].decay,
        wet:   fxParams[fxName].wet
      });
      break;

    case "Hypno Chorus":
      fxNode = new Tone.Chorus({
        rate:     fxParams[fxName].rate,
        depth:    fxParams[fxName].depth,
        feedback: fxParams[fxName].feedback
      });
      fxNode.start();
      break;

    case "Super Delay":
      fxNode = new Tone.FeedbackDelay({
        delayTime: fxParams[fxName].delayTime,
        feedback:  fxParams[fxName].feedback
      });
      break;

    case "Complex Distortion":
      fxNode = new Tone.Distortion({
        distortion: fxParams[fxName].distortion,
        oversample: fxParams[fxName].oversample
      });
      break;

    default:
      fxNode = null;
  }

  // 🔹 Application du nouvel FX si défini
  if (fxNode && canConnect) {
    try {
      if (canDisconnect) {
        sampler.disconnect();
      }
      sampler.connect(fxNode);
      if (typeof fxNode.connect === "function") {
        fxNode.connect(Tone.Destination);
      }
      instrument.fx = fxNode;
    } catch (e) {
      console.warn("FX routing failed:", e);
    }
  }

  // 🔹 Mise à jour de l'état
  setInstrumentList(prev => ({
    ...prev,
    [selectedSlot.channel]: {
      ...prev[selectedSlot.channel],
      fx: fxName || null
    }
  }));
}


  /*
  const updateFXParam = (fxName, param, value) => {
    setFXParams(prev => ({
      ...prev,
      [fxName]: {
        ...prev[fxName],
        [param]: value
      }
    }));
  };

  */
  const handleApplyFX = (e, assignedChannel) => {

  if (!assignedChannel) return;
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
    }
  }, [selectedSlot, instrumentList]);

  useEffect(() => {
    console.log("🎛 FX actuel :", instrumentList[selectedSlot.channel]?.fx);
    console.log("🔊 Volume actuel :", instrumentList[selectedSlot.channel]?.volume);
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
                value={instrumentList[assignedChannel]?.volume ?? 50}
                className="h-50 w-[200px] rotate-[-90deg] mt-4"
                disabled={!assignedChannel}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const db = Tone.gainToDb(value / 50);

                  setInstrumentList(prev => {
                    const updated = { ...prev };

                    if (updated[assignedChannel]?.volumeNode) {
                      updated[assignedChannel].volumeNode.volume.value = db;
                    }

                    updated[assignedChannel].volume = value;

                    return updated;
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
