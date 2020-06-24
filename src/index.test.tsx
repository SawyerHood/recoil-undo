import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useUndo, useRedo, RecoilUndoRoot } from './index';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

const COUNT = atom({
  default: 0,
  key: 'count',
});

const TWO_TIMES = selector({
  get: ({ get }) => get(COUNT) * 2,
  key: 'two_times',
});

const App = () => {
  return (
    <RecoilRoot>
      <RecoilUndoRoot trackedAtoms={[COUNT]}>
        <Counter />
      </RecoilUndoRoot>
    </RecoilRoot>
  );
};

function Counter() {
  const [count, setCount] = useRecoilState(COUNT);
  const double = useRecoilValue(TWO_TIMES);
  const undo = useUndo();
  const redo = useRedo();
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
      <div>{double}</div>
    </div>
  );
}

describe('recoil-undo', () => {
  it('handles a simple undo and redo case', () => {
    const { getByTestId } = render(<App />);
    const inc = getByTestId('inc');
    const dec = getByTestId('dec');
    const count = getByTestId('count');
    const undoButton = getByTestId('undo');
    const redoButton = getByTestId('redo');

    const plus = () => fireEvent.click(inc);
    const minus = () => fireEvent.click(dec);
    const getCount = () => Number(count.textContent);
    const undo = () => fireEvent.click(undoButton);
    const redo = () => fireEvent.click(redoButton);

    plus();
    expect(getCount()).toBe(1);

    plus();
    plus();
    minus();
    expect(getCount()).toBe(2);
    undo();
    expect(getCount()).toBe(3);
    redo();
    expect(getCount()).toBe(2);
  });
});
