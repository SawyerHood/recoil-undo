import '@testing-library/jest-dom/extend-expect';
import { renderCounter, COUNT } from './test_utils/examples';

describe('recoil-undo', () => {
  it('handles a simple undo and redo case', () => {
    const {
      plus,
      minus,
      redo,
      undo,
      getCount,
      getCountx2,
      typeText,
      getText,
    } = renderCounter();
    plus();
    expect(getCount()).toBe(1);

    plus();
    plus();
    minus();
    expect(getCount()).toBe(2);
    // It also works with selectors
    expect(getCountx2()).toBe(4);

    undo();

    expect(getCount()).toBe(3);
    expect(getCountx2()).toBe(6);

    redo();
    expect(getCount()).toBe(2);
    expect(getCountx2()).toBe(4);

    typeText('yeet');
    expect(getText()).toBe('yeet');

    undo();
    expect(getText()).toBe('');
    expect(getCount()).toBe(2);
  });

  it('only changes tracked atoms when undoing', () => {
    const {
      plus,
      minus,
      redo,
      undo,
      getCount,
      getCountx2,
      typeText,
      getText,
    } = renderCounter({ trackedAtoms: [COUNT] });

    plus();
    expect(getCount()).toBe(1);

    plus();
    plus();
    minus();
    expect(getCount()).toBe(2);
    // It also works with selectors
    expect(getCountx2()).toBe(4);

    undo();

    expect(getCount()).toBe(3);
    expect(getCountx2()).toBe(6);

    redo();
    expect(getCount()).toBe(2);
    expect(getCountx2()).toBe(4);

    typeText('yeet');
    expect(getText()).toBe('yeet');

    undo();
    expect(getText()).toBe('yeet');
    expect(getCount()).toBe(3);
  });

  it('handles batching atom changes', () => {
    const {
      plus,
      minus,
      undo,
      getCount,
      startBatch,
      endBatch,
    } = renderCounter();
    plus();
    expect(getCount()).toBe(1);

    startBatch();
    plus();
    plus();
    plus();
    minus();
    plus();
    expect(getCount()).toBe(4);
    endBatch();
    minus();

    expect(getCount()).toBe(3);
    undo();
    expect(getCount()).toBe(4);
    undo();
    expect(getCount()).toBe(1);
    undo();
    expect(getCount()).toBe(0);
  });

  it('tracking of changes can be disabled', () => {
    const {
      plus,
      minus,
      undo,
      getCount,
      startTracking,
      stopTracking,
    } = renderCounter({ trackingByDefault: false });
    plus();
    plus();
    undo();
    expect(getCount()).toBe(2);
    startTracking();
    plus();
    expect(getCount()).toBe(3);
    undo();
    expect(getCount()).toBe(2);
    undo();
    expect(getCount()).toBe(2);
    minus();
    stopTracking();
    minus();
    expect(getCount()).toBe(0);
    undo();
    expect(getCount()).toBe(2);
  });
});
