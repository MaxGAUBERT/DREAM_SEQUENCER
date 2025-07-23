import { createContext, useCallback, useContext, useReducer } from 'react';

const HistoryContext = createContext(null);
export const useHistoryContext = () => useContext(HistoryContext);

// ✅ Reducer pur, sans effets de bord
function historyReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return {
        past: [...state.past, action.payload],
        future: [],
      };

    case 'UNDO': {
      const last = state.past[state.past.length - 1];
      if (!last) return state;
      return {
        past: state.past.slice(0, -1),
        future: [last, ...state.future],
      };
    }

    case 'REDO': {
      const next = state.future[0];
      if (!next) return state;
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

  // ✅ Accepte soit un objet action complet, soit juste les données
  const addAction = useCallback((actionOrData) => {
    let action;
    
    // Si c'est déjà un objet action avec apply/revert, on l'utilise tel quel
    if (typeof actionOrData?.apply === 'function') {
      action = actionOrData;
      action.apply();
    } else {
      // Sinon, on considère que ce sont juste des données à stocker
      action = actionOrData;
    }
    
    dispatch({ type: 'ADD', payload: action });
  }, [dispatch]);

  // ✅ Gère les actions avec ou sans méthode revert
  const undo = useCallback(() => {
    const last = state.past[state.past.length - 1];
    if (!last) return;
    
    if (typeof last.revert === 'function') {
      last.revert();
    }
    // Si pas de méthode revert, on fait juste l'undo dans l'historique
    
    dispatch({ type: 'UNDO' });
  }, [state.past, dispatch]);

  const redo = useCallback(() => {
    const next = state.future[0];
    if (!next) return;
    
    if (typeof next.apply === 'function') {
      next.apply();
    }
    // Si pas de méthode apply, on fait juste le redo dans l'historique
    
    dispatch({ type: 'REDO' });
  }, [state.future, dispatch]);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, [dispatch]);

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