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
  RecoilState,
  Loadable,
} from 'recoil';

type History = {
  past: Snapshot[];
  present: Snapshot;
  future: Snapshot[];
};

type AtomMap = Map<RecoilState<any>, Loadable<any>>;

type ContextState = {
  undo: () => void;
  redo: () => void;
};

const UndoContext = React.createContext<ContextState>({
  undo: () => {},
  redo: () => {},
});

type Props = {
  children?: React.ReactNode;
  trackedAtoms?: RecoilState<any>[];
};

export const RecoilUndoRoot = React.memo(
  ({ children, trackedAtoms }: Props): React.ReactElement => {
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

      if (trackedAtoms) {
        const prevMap = getAtomMap(previousSnapshot, trackedAtoms);
        const currMap = getAtomMap(snapshot, trackedAtoms);
        if (!didAtomMapsChange(prevMap, currMap)) {
          setHistory({ ...history, present: snapshot });
          return;
        }
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
        const target = history.past[history.past.length - 1];
        const { present } = history;
        const newPresent = mapTrackedAtomsOntoSnapshot(
          present,
          target,
          trackedAtoms,
        );

        gotoSnapshot(newPresent);

        return {
          past: history.past.slice(0, history.past.length - 1),
          present: newPresent,
          future: [history.present, ...history.future],
        };
      });
    }, [setHistory, gotoSnapshot, trackedAtoms]);

    const redo = useCallback(() => {
      setHistory((history: History) => {
        if (!history.future.length) {
          return history;
        }

        isUndoingRef.current = true;
        const target = history.future[0];
        const { present } = history;
        const newPresent = mapTrackedAtomsOntoSnapshot(
          present,
          target,
          trackedAtoms,
        );
        gotoSnapshot(newPresent);

        return {
          past: [...history.past, history.present],
          present: newPresent,
          future: history.future.slice(1),
        };
      });
    }, [setHistory, gotoSnapshot, trackedAtoms]);

    const value = useMemo(() => ({ undo, redo }), [undo, redo]);

    return (
      <UndoContext.Provider value={value}>{children}</UndoContext.Provider>
    );
  },
);

function mapTrackedAtomsOntoSnapshot(
  current: Snapshot,
  target: Snapshot,
  trackedAtoms: RecoilState<any>[] | null | undefined,
): Snapshot {
  if (!trackedAtoms) {
    return target;
  }

  const atomMap = getAtomMap(target, trackedAtoms);

  return current.map((pendingSnap) => {
    for (const [atom, loadable] of atomMap.entries()) {
      if (loadable.state === 'hasValue') {
        pendingSnap.set(atom, loadable.contents);
      }
    }
  });
}

function getAtomMap(snap: Snapshot, trackedAtoms: RecoilState<any>[]): AtomMap {
  const atomMap = new Map<RecoilState<any>, Loadable<any>>();
  for (const atom of trackedAtoms) {
    atomMap.set(atom, snap.getLoadable(atom));
  }
  return atomMap;
}

function didAtomMapsChange(prev: AtomMap, curr: AtomMap): boolean {
  if (prev.size !== curr.size) {
    return true;
  }

  for (const key of prev.keys()) {
    if (!curr.has(key)) {
      return true;
    }

    const prevVal = prev.get(key)!;
    const currVal = curr.get(key)!;

    // I'm pretty sure that atoms can't have a loading state
    if (prevVal.state !== currVal.state) {
      return true;
    }

    if (
      prevVal.state === 'hasValue' &&
      currVal.state === 'hasValue' &&
      prevVal.contents !== currVal.contents
    ) {
      return true;
    }
  }

  return false;
}

export function useUndo(): () => void {
  const { undo } = useContext(UndoContext);
  return undo;
}

export function useRedo(): () => void {
  const { redo } = useContext(UndoContext);
  return redo;
}
