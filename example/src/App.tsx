import React from 'react';
import {
  RecoilRoot,
  atom,
  useRecoilState,
  selector,
  useRecoilValue,
} from 'recoil';
import { RecoilUndoRoot, useUndo, useRedo, useBatching } from 'recoil-undo';

const COUNT = atom({
  default: 0,
  key: 'count',
});

const TEXT = atom({
  default: '',
  key: 'text',
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
  const { startBatch, endBatch } = useBatching();
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div>
        <Button onClick={() => setCount((count) => count - 1)}>-</Button>
        {count}
        <Button onClick={() => setCount((count) => count + 1)}>+</Button>
      </div>
      <Button onClick={undo}>Undo</Button>
      <Button onClick={redo}>Redo</Button>
      <Input />
      <div>{double}</div>
      <Button onClick={startBatch}>Start Batch</Button>
      <Button onClick={endBatch}>End Batch</Button>
    </div>
  );
}

function Button(props: { onClick: () => void; children: React.ReactNode }) {
  const style = {
    margin: '12px 12px',
  };
  return (
    <button style={style} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

function Input() {
  const [text, setText] = useRecoilState(TEXT);
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}

export default App;
