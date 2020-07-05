import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useUndo, useRedo, RecoilUndoRoot, useBatching } from '../index';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  RecoilState,
} from 'recoil';

export const COUNT = atom({
  default: 0,
  key: 'count',
});

const TWO_TIMES = selector({
  get: ({ get }) => get(COUNT) * 2,
  key: 'two_times',
});

const TEXT = atom({
  default: '',
  key: 'text',
});

type Props = { trackedAtoms?: RecoilState<any>[] };

const App = (props: Props) => {
  return (
    <RecoilRoot>
      <RecoilUndoRoot {...props}>
        <Counter />
      </RecoilUndoRoot>
    </RecoilRoot>
  );
};

function Counter() {
  const [count, setCount] = useRecoilState(COUNT);
  const double = useRecoilValue(TWO_TIMES);
  const [text, setText] = useRecoilState(TEXT);
  const undo = useUndo();
  const redo = useRedo();
  const { startBatch, endBatch } = useBatching();
  return (
    <div>
      <div>
        <button
          data-testid='dec'
          onClick={() => setCount((count) => count - 1)}
        >
          -
        </button>
        <span data-testid='count'>{count}</span>
        <button
          data-testid='inc'
          onClick={() => setCount((count) => count + 1)}
        >
          +
        </button>
      </div>
      <button data-testid='undo' onClick={undo}>
        Undo
      </button>
      <button data-testid='redo' onClick={redo}>
        Redo
      </button>
      <div data-testid='countx2'>{double}</div>
      <input
        data-testid='text'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button data-testid='startBatch' onClick={startBatch}>
        Start Batch
      </button>
      <button data-testid='endBatch' onClick={endBatch}>
        End Batch
      </button>
    </div>
  );
}

export function renderCounter(props: Props = {}) {
  const queries = render(<App {...props} />);
  const inc = queries.getByTestId('inc');
  const dec = queries.getByTestId('dec');
  const count = queries.getByTestId('count');
  const undoButton = queries.getByTestId('undo');
  const redoButton = queries.getByTestId('redo');
  const countx2 = queries.getByTestId('countx2');
  const text = queries.getByTestId('text') as HTMLInputElement;
  const startBatchButton = queries.getByTestId('startBatch');
  const endBatchButton = queries.getByTestId('endBatch');

  const plus = () => fireEvent.click(inc);
  const minus = () => fireEvent.click(dec);
  const getCount = () => Number(count.textContent);
  const undo = () => fireEvent.click(undoButton);
  const redo = () => fireEvent.click(redoButton);
  const getCountx2 = () => Number(countx2.textContent);
  const getText = () => text.value;
  const typeText = (value: string) =>
    fireEvent.change(text, { target: { value } });
  const startBatch = () => fireEvent.click(startBatchButton);
  const endBatch = () => fireEvent.click(endBatchButton);

  return {
    plus,
    minus,
    getCount,
    undo,
    redo,
    getCountx2,
    getText,
    typeText,
    startBatch,
    endBatch,
    queries,
  };
}
