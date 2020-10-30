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

// The core structure that keeps track of
// the undo and redo stacks
type History = {
  past: Snapshot[];
  present: Snapshot;
  future: Snapshot[];
};

type AtomMap = Map<RecoilState<any>, Loadable<any>>;

type ContextState = {
  undo: () => void;
  redo: () => void;
  startBatch: () => void;
  endBatch: () => void;
  startUsingHistory: () => void;
  stopUsingHistory: () => void;
  getTotalPast: () => void;
  getTotalFuture: () => void;
};

const UndoContext = React.createContext<ContextState>({
  undo: () => {},
  redo: () => {},
  startBatch: () => {},
  endBatch: () => {},
  startUsingHistory: () => {},
  stopUsingHistory: () => {},
  getTotalPast: () => {},
  getTotalFuture: () => {},
});

type Props = {
  children?: React.ReactNode;
  trackedAtoms?: RecoilState<any>[];
  manualHistory?: boolean;
};

export const RecoilUndoRoot = React.memo(
  ({
    children,
    trackedAtoms,
    manualHistory = false,
  }: Props): React.ReactElement => {
    const currentSnapshot = useRecoilSnapshot();

    // For perf reasons we might want to move this into a ref.
    const [history, setHistory] = useState<History>({
      past: [],
      present: currentSnapshot,
      future: [],
    });

    const gotoSnapshot = useGotoRecoilSnapshot();

    const isUsingHistory = useRef<boolean>(manualHistory !== true);

    // Hack: while we are undoing, keep track of it so we don't record that as
    // a part of history. This might not work with concurrent mode.
    const isUndoingRef = useRef<boolean>(false);

    const isBatchingRef = useRef<boolean>(false);

    useRecoilTransactionObserver_UNSTABLE(({ snapshot, previousSnapshot }) => {
      // Assume that undo will only trigger a single transaction observer update
      if (isUndoingRef.current) {
        isUndoingRef.current = false;
        return;
      }

      if (!isUsingHistory) {
        return;
      }

      if (isBatchingRef.current) {
        setHistory({ ...history, present: snapshot });
        return;
      }

      // If we are tracking atoms, make sure that the atoms we are tracking
      // actually changed. If not, bail early
      if (trackedAtoms) {
        const prevMap = getAtomMap(previousSnapshot, trackedAtoms);
        const currMap = getAtomMap(snapshot, trackedAtoms);
        if (!didAtomMapsChange(prevMap, currMap)) {
          // Make sure that we update the present snapshot
          setHistory({ ...history, present: snapshot });
          return;
        }
      }

      // Add the previous snapshot to the past
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

    const startBatch = useCallback(() => {
      isBatchingRef.current = true;
      setHistory((history) => {
        return { ...history, past: [...history.past, history.present] };
      });
    }, [isBatchingRef, setHistory]);

    const endBatch = useCallback(() => {
      isBatchingRef.current = false;
    }, [isBatchingRef]);

    const startUsingHistory = useCallback(() => {
      if (!manualHistory) {
        return;
      }
      isUsingHistory.current = true;
    }, [manualHistory]);

    const stopUsingHistory = useCallback(() => {
      if (!manualHistory) {
        return;
      }
      isUsingHistory.current = false;
    }, [manualHistory]);

    const getTotalPast = () => {
      return history.past.length;
    };
    const getTotalFuture = () => {
      return history.future.length;
    };

    const value = useMemo(
      () => ({
        undo,
        redo,
        startBatch,
        endBatch,
        startUsingHistory,
        stopUsingHistory,
        getTotalPast,
        getTotalFuture,
      }),
      [undo, redo, startBatch, endBatch, startUsingHistory, stopUsingHistory],
    );

    return (
      <UndoContext.Provider value={value}>{children}</UndoContext.Provider>
    );
  },
);

// This function is used to apply the relevant atoms onto a target snapshot
// (which is a future or a past snapshot). It leaves all non tracked atoms unchanged
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

// Compare two atom map and check if any of the values have changed
// (via a === comparison). Useful to see if a new history entry
// should be added to the stack or not.
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

export function useUndoHistory() {
  const {
    startUsingHistory,
    stopUsingHistory,
    getTotalPast,
    getTotalFuture,
  } = useContext(UndoContext);
  return { startUsingHistory, stopUsingHistory, getTotalPast, getTotalFuture };
}

export function useUndo(): () => void {
  const { undo } = useContext(UndoContext);
  return undo;
}

export function useRedo(): () => void {
  const { redo } = useContext(UndoContext);
  return redo;
}

export function useBatching(): {
  startBatch: () => void;
  endBatch: () => void;
} {
  const { startBatch, endBatch } = useContext(UndoContext);
  return useMemo(() => ({ startBatch, endBatch }), [startBatch, endBatch]);
}
