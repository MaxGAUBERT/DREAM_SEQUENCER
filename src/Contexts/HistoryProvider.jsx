import { createContext, useCallback, useContext, useReducer } from 'react';

const HistoryContext = createContext(null);
export const useHistoryContext = () => useContext(HistoryContext);

function historyReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      action.payload.apply();
      return {
        past: [...state.past, action.payload],
        future: [],
      };
    case 'UNDO': {
      const last = state.past[state.past.length - 1];
      if (!last) return state;
      last.revert();
      return {
        past: state.past.slice(0, -1),
        future: [last, ...state.future],
      };
    }
    case 'REDO': {
      const next = state.future[0];
      if (!next) return state;
      next.apply();
      return {
        past: [...state.past, next],
        future: state.future.slice(1),
      };
    }
    case 'CLEAR':
      return { past: [], future: [] };
    default:
      return state;
  }
}

export function HistoryProvider({ children }) {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    future: [],
  });

  const addAction = useCallback((action) => {
    dispatch({ type: 'ADD', payload: action });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <HistoryContext.Provider
      value={{
        undo,
        redo,
        addAction,
        clear,
        state, 
        dispatch,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        history: state.past,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}
