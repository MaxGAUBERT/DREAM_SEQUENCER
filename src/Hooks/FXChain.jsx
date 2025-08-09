import { useRef, useEffect } from "react";
import { useProjectManager } from "../Hooks/useProjectManager";
import useFXChain from "../Hooks/useFXChain";
import * as Tone from "tone";

const FXChain = ({instrumentList, setInstrumentList}) => {
  const slotRefs = useRef({});
  const { updateInstrumentSlot } = useProjectManager();
  const { slots, selectedSlot, setSelectedSlot, fxParams, setFXParams } = useFXChain();

  const getChannelAtSlot = (slotNumber) => {
    const entries = Object.entries(instrumentList || {});
    const entry = entries.find(
      ([, { slot }]) => Number(slot) === Number(slotNumber)
    );
    return entry?.[0] || null;
  };

  function applyFXChainToInstrument(instrument, fxName) {
  if (!instrument?.sampler) return;

  // 🔹 Nettoyage de l'ancien FX
  if (instrument.fx) {
    instrument.sampler.disconnect(instrument.fx);
    instrument.fx.dispose?.();
    instrument.fx = null;
  }

  // 🔹 Si aucun effet sélectionné → on quitte
  if (!fxName || fxName === "-- Select an effect --") {
    instrument.sampler.connect(Tone.Destination);
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
  let fxNode;
  switch (fxName) {
    case "Reverberator":
      fxNode = new Tone.Reverb({
        decay: fxParams[fxName].decay,
        wet: fxParams[fxName].wet
      }).toDestination();
      break;
    case "Hypno Chorus":
      fxNode = new Tone.Chorus({
        rate: fxParams[fxName].rate,
        depth: fxParams[fxName].depth,
        feedback: fxParams[fxName].feedback
      }).toDestination().start();
      break;
    case "Super Delay":
      fxNode = new Tone.FeedbackDelay({
        delayTime: fxParams[fxName].delayTime,
        feedback: fxParams[fxName].feedback
      }).toDestination();
      break;
    case "Complex Distortion":
      fxNode = new Tone.Distortion({
        distortion: fxParams[fxName].distortion,
        oversample: fxParams[fxName].oversample
      }).toDestination();
      break;
    default:
      fxNode = null; // pas de fallback obligatoire
  }

  // 🔹 Application du nouvel FX si défini
  if (fxNode) {
    instrument.sampler.connect(fxNode);
    instrument.fx = fxNode;
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
  }, [selectedSlot]);

  useEffect(() => {
    console.log("🎛 FX actuel :", instrumentList[selectedSlot.channel]?.fx);
  }, [instrumentList]);


  const handleSlotClick = (slotNumber) => {
    const assignedChannel = getChannelAtSlot(slotNumber);
    setSelectedSlot({ channel: assignedChannel, slot: slotNumber });
  };

  return (
    <div className="absolute bg-black scrollbar-custom text-white top-[50px] border-2 overflow-auto resize w-[800px] h-500 min-h-1/2 max-w-[935px] max-h-[80vh] shadow-lg p-4 flex flex-col gap-4">
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
                className="w-full bg-gray-900 text-white text-sm p-1 rounded border border-gray-600 mb-2"
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
                className="h-50 w-[200px] rotate-[-90deg] mt-4"
                disabled={!assignedChannel}
                onClick={(e) => {
                  e.stopPropagation();
                  if (assignedChannel) {
                    updateInstrumentSlot(assignedChannel, s);
                  }
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
