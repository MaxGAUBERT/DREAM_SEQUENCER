import { InitialStates } from "./InitialStates";

let nextPatternId = 1; // Commence à 2 si le premier pattern est id:1

export const ProjectReducer = (state, action) => {
  switch (action.type) {
    case "RESET_PROJECT":
      return InitialStates;

    // pattern manager

    case "ADD_PATTERN": {
      if (!state.channelSources) return state;

      const newId = state.nextPatternId;

      const instrumentGrids = {};
      Object.keys(state.channelSources).forEach((instrumentName) => {
        instrumentGrids[instrumentName] = Array.from({ length: state.rows }, () =>
          Array(state.cols).fill(false)
        );
      });

      const newPattern = {
        id: newId,
        name: `Pattern ${newId}`,
        players: { ...state.channelSources },
        grids: instrumentGrids,
      };

      return {
        ...state,
        nextPatternId: newId + 1,
        patterns: [...state.patterns, newPattern],
        selectedPattern: newPattern,
        grids: instrumentGrids,
      };
    }

    case "DELETE_PATTERN": {
      const { selectedPattern, patterns } = state;
      if (!selectedPattern || patterns.length <= 1) return state;

      const updatedPatterns = patterns.filter(p => p.id !== selectedPattern.id);

      const reindexedPatterns = updatedPatterns.map((pattern, index) => ({
        ...pattern,
        id: index + 1,
        name: `Pattern ${index + 1}`,
      }));

      const deletedIndex = patterns.findIndex(p => p.id === selectedPattern.id);
      const newSelected = reindexedPatterns[Math.min(deletedIndex, reindexedPatterns.length - 1)];

      return {
        ...state,
        patterns: reindexedPatterns,
        selectedPattern: newSelected,
        grids: newSelected.grids || {},
      };
    }

    case "DUPLICATE_PATTERN": {
      const { selectedPattern } = state;
      if (!selectedPattern) return state;

      const deepCopyGrids = {};
      Object.keys(selectedPattern.grids).forEach(instrumentId => {
        deepCopyGrids[instrumentId] = selectedPattern.grids[instrumentId].map(row => [...row]);
      });

      const duplicatedPattern = {
        ...selectedPattern,
        id: state.nextPatternId + 1,
        name: `${selectedPattern.name} Copy`,
        grids: deepCopyGrids,
      };

      return {
        ...state,
        patterns: [...state.patterns, duplicatedPattern],
        selectedPattern: duplicatedPattern,
        grids: deepCopyGrids,
      };
    }

    case "SELECT_PATTERN": {
      const selected = action.payload;
      return {
        ...state,
        selectedPattern: selected,
        grids: selected?.grids || {},
      };
    }

    case "SET_SELECTED_PATTERN":
      return {
        ...state,
        selectedPattern: action.payload,
        grids: action.payload?.grids || {},
    };


    // channel Rack
    case "UPDATE_SAMPLES":
        const handleSamplesUpdated = action.payload;
        
        return {
            ...state,
            players: handleSamplesUpdated,
        }

    case "UPDATE_CHANNELS":
        const handleChannelsUpdated = action.payload;

        return  {
            ...state,
            channelSources: handleChannelsUpdated,
        }

    case "URL_UPDATED":
        const handleUrlUpdated = action.payload;
        
        return {
            ...state,
            channelSources: handleUrlUpdated,
        }

    case "PATTERN_UPDATED":
        const handlePatternsUpdated = action.payload;

        return {
            ...state,
            patterns: handlePatternsUpdated,
        }
    
    default:
      return state;

    case "SET_SAMPLE": {
        const { name, sampler, url } = action.payload;
        return {
          ...state,
          players: { ...state.players, [name]: sampler },
          channelSources: { ...state.channelSources, [name]: url }
        };
    }


    case "ADD_CHANNEL": {
      const { name, rows, cols } = action.payload;

      return {
        ...state,
        players: { ...state.players, [name]: null },
        channelSources: { ...state.channelSources, [name]: null },
        grids: {
          ...state.grids,
          [name]: Array.from({ length: rows }, () => Array(cols).fill(false))
        }
      };
    }

    case "REMOVE_CHANNEL": {
      const channel = action.payload;
      const newPlayers = { ...state.players };
      const newSources = { ...state.channelSources };
      const newGrids = { ...state.grids };

      delete newPlayers[channel];
      delete newSources[channel];
      delete newGrids[channel];

      return {
        ...state,
        players: newPlayers,
        channelSources: newSources,
        grids: newGrids
      };
    }

        


  }
};
