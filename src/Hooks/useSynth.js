import { useReducer } from "react";

const synthParams = {
    synthType: "",
    osc: {
        type: ""
    },
    envelope: {
        attack: 0,
        decay: 0,
        sustain: 0,
        release: 0
    },
    freq: 0,
    detune: 0,
    vol: 50
};

function synthReducer(state, action) {
    switch (action.type) {
        case 'SET_SYNTH_TYPE':
            return {
                ...state,
                synthType: action.payload,
            };
        case 'SET_OSC_TYPE':
            return {
                ...state,
                osc: {
                    ...state.osc,
                    type: action.payload,
                }
            };
        case 'SET_ENVELOPE':
            return {
                ...state,
                envelope: {
                    ...state.envelope,
                    ...action.payload,
                }
            };
        case 'SET_FREQ':
            return {
                ...state,
                freq: action.payload,
            };
        case 'SET_VOL':
            return {
                ...state,
                vol: action.payload,
            };
        case 'SET_DETUNE':
            return {
                ...state,
                detune: action.payload,
            }
        case 'RESET_ALL':
            return synthParams;
        default:
            return state;
    }
}


export function useSynth () {
    const availableSynthTypes = {
        Synth: "Synth",
        AMSynth: "AMSynth",
        FMSynth: "FMSynth",
        DuoSynth: "DuoSynth",
        MonoSynth: "MonoSynth",
        MembraneSynth: "MembraneSynth",
    };
    
    const [state, dispatch] = useReducer(synthReducer, synthParams);
    return { availableSynthTypes, state, dispatch };
};
