# recoil-undo

> Undo functionality for the recoil state management library

[![NPM](https://img.shields.io/npm/v/recoil-undo.svg)](https://www.npmjs.com/package/recoil-undo)

## Notice

This is an incredibly early library and much like recoil itself the api will almost certainly change. Right now the functionality is very basic, but expect it to come much more robust over time and those changes might not be backwards compatible at the moment.

## Install

`recoil-undo` relies on both React and Recoil installed as peer dependencies so make sure they are installed as well.

```bash
npm install --save recoil-undo
```

or

```bash
yarn add recoil-undo
```

## Usage

Make sure that you include you put `RecoilUndoRoot` under `RecoilRoot`. From there you can use the `useUndo` hook that will return a callback that will undo the last state change.

```tsx
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
    <div>
      <div>
        <button onClick={() => setCount((count) => count - 1)}>-</button>
        {count}
        <button onClick={() => setCount((count) => count + 1)}>+</button>
      </div>
      <button onClick={undo}>Undo</button>
    </div>
  );
}
```

## Roadmap

- Redo
- Undo filtering (only undo certain atoms)
- Undo batching (batch multiple changes into a single history entry)
- Undo scoping (keep multiple undo stacks in a single application)

## License

MIT © [SawyerHood](https://github.com/SawyerHood)
