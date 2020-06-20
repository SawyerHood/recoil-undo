import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useContext,
} from 'react';
import {
  useRecoilTransactionObserver_UNSTABLE,
  Snapshot,
  useRecoilSnapshot,
  useGotoRecoilSnapshot,
} from 'recoil';

type History = {
  past: Snapshot[];
  present: Snapshot;
  future: Snapshot[];
};

type ContextState = {
  undo: () => void;
};

const UndoContext = React.createContext<ContextState>({ undo: () => {} });

type Props = {
  children?: React.ReactNode;
};

export const RecoilUndoRoot = React.memo(
  ({ children }: Props): React.ReactElement => {
    const currentSnapshot = useRecoilSnapshot();
    const [history, setHistory] = useState<History>({
      past: [],
      present: currentSnapshot,
      future: [],
    });
    const gotoSnapshot = useGotoRecoilSnapshot();
    const isUndoingRef = useRef<boolean>(false);

    useRecoilTransactionObserver_UNSTABLE(({ snapshot, previousSnapshot }) => {
      if (isUndoingRef.current) {
        isUndoingRef.current = false;
        return;
      }
      setHistory({
        past: [...history.past, previousSnapshot],
        present: snapshot,
        future: [],
      });
    });

    const undo = useCallback(() => {
      setHistory((history: History) => {
        if (!history.past.length) {
          return history;
        }

        isUndoingRef.current = true;
        gotoSnapshot(history.past[history.past.length - 1]);

        return {
          past: history.past.slice(0, history.past.length - 1),
          present: history.past[history.past.length - 1],
          future: [history.present, ...history.future],
        };
      });
    }, [setHistory, gotoSnapshot]);

    const value = useMemo(() => ({ undo }), [undo]);

    return (
      <UndoContext.Provider value={value}>{children}</UndoContext.Provider>
    );
  },
);

export function useUndo(): () => void {
  const { undo } = useContext(UndoContext);
  return undo;
}
