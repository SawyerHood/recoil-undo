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
The library is written in typescript and ts support work out of the box.

```tsx
import React from 'react';
import { RecoilRoot, atom, useRecoilState } from 'recoil';
import { RecoilUndoRoot, useUndo, useRedo } from 'recoil-undo';

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
  const redo = useRedo();
  return (
    <div>
      <div>
        <button onClick={() => setCount((count) => count - 1)}>-</button>
        {count}
        <button onClick={() => setCount((count) => count + 1)}>+</button>
      </div>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </div>
  );
}
```

## Api

### RecoilUndoRoot

This component is exported from `recoil-undo` and should be placed right under the `RecoilRoot` provider in the application.
It is responsible for keeping track of the undo history from your `recoil` state. At the moment it takes a single optional property,
`trackedAtoms` which is an array of `RecoilState` (the value that is returned from `atom` in `recoil`). If `trackedAtoms` is passed into
`RecoilUndoRoot` the undo stack will only apply to the atoms provided, all other atoms will be ignored when undoing / redoing. Note: there is
no reason to track selectors, as their values will be updated as the atoms change.

If `trackedAtoms` is not passed to `RecoilUndoState` all atoms will be tracked by `recoil-undo`.

### useUndo

This hook returns a function that when called will move all tracked atoms to the previous history state.

### useRedo

This hook returns a function that when called will move all tracked atoms to the next history state.

### useBatching

This hook returns an object with two properties `startBatch` and `endBatch`. There are many situations where you might want to turn mutliple user interactions into a single item in the undo stack.
Example: suppose a user is dragging an object across the screen, you don't want to record every mouse move as an undoable operation. Instead, you only want to record the start and end position on the undo stack.
In cases like these, you can call `startBatch` and `endBatch` to make sure multiple atom updates only add a single item to the undo stack.

```js
const { startBatch, endBatch } = useBatching();

const onMouseDown = () => {
  startBatch();
};

const onMouseMove = () => {
  // Update item position
};

const onMouseUp = () => {
  endBatch();
};
```

### useRecoilHistory

This hook returns object with `startTrackingHistory()`, `stopTrackingHistory()`, `getIsTrackingHistory()`, `getTotalPast()` and `getTotalFuture()` functions.

````js

const undo = useUndo();
const {startTrackingHistory, stopTrackingHistory, getTotalPast, getTotalFuture, getIsTrackingHistory} = useRecoilHistory();

// default value = 23
const [value, setValue] = useRecoilState(valueAtom);
startTrackingHistory();
setValue({value: 1});
stopTrackingHistory();

// getTotalPast() === 1

setRecoilValue({value: 55});
// getTotalPast() === 1
undo();
// getTotalPast() === 0
// getTotalFuture() === 1
// value === 23

````

## Roadmap

- Undo scoping (keep multiple undo stacks in a single application)

## License

MIT © [SawyerHood](https://github.com/SawyerHood)
