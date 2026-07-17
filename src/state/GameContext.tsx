import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type PropsWithChildren,
} from 'react';
import { caseContent as gameContent } from '../data/caseContent';
import type { GameContent, GameState } from '../types/game';
import { createInitialGameState } from './defaultState';
import { loadGameState, saveGameState, type StorageLike } from './storage';
import { createGameReducer, type GameAction } from './reducer';

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  content: GameContent;
  saveAvailable: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider = ({ children }: PropsWithChildren) => {
  const reducer = useMemo(() => createGameReducer(gameContent), []);
  const storage = useMemo<StorageLike | null>(() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }, []);
  const [saveAvailable, setSaveAvailable] = useState(Boolean(storage));
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    storage ? loadGameState(storage, gameContent) : createInitialGameState(undefined, gameContent),
  );
  const previousStateRef = useRef(state);

  useEffect(() => {
    const previousState = previousStateRef.current;
    previousStateRef.current = state;
    const changedKeys = (Object.keys(state) as Array<keyof GameState>).filter(
      (key) => state[key] !== previousState[key],
    );
    const timerOnly = changedKeys.length === 1 && changedKeys[0] === 'elapsedSeconds';
    if (timerOnly && state.elapsedSeconds % 5 !== 0) return;
    if (!storage) return;
    setSaveAvailable(saveGameState(storage, state));
  }, [state, storage]);

  useEffect(() => {
    if (!state.hasStarted || state.hasFinished) return undefined;
    const timerId = window.setInterval(() => dispatch({ type: 'TICK' }), 1_000);
    return () => window.clearInterval(timerId);
  }, [state.hasFinished, state.hasStarted]);

  const value = useMemo(
    () => ({ state, dispatch, content: gameContent, saveAvailable }),
    [saveAvailable, state],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextValue => {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame должен вызываться внутри GameProvider.');
  return value;
};
