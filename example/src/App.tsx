import React from 'react';
import { RecoilRoot, atom, useRecoilState } from 'recoil';
import { RecoilUndoRoot, useUndo } from 'recoil-undo';

const COUNT = atom({
  default: 0,
  key: 'count',
});

const App = () => {
  return (
    <RecoilRoot>
      <RecoilUndoRoot>
        <Counter />
      </RecoilUndoRoot>
    </RecoilRoot>
  );
};

function Counter() {
  const [count, setCount] = useRecoilState(COUNT);
  const undo = useUndo();
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

export default App;
