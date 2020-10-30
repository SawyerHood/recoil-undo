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
      getTotalPast,
      getTotalFuture,
    } = renderCounter();
    expect(getTotalPast()).toBe(0);
    expect(getTotalFuture()).toBe(0);
    plus();
    expect(getCount()).toBe(1);
    expect(getTotalPast()).toBe(1);

    plus();
    plus();
    minus();
    expect(getCount()).toBe(2);
    expect(getTotalPast()).toBe(4);
    // It also works with selectors
    expect(getCountx2()).toBe(4);

    undo();
    expect(getTotalPast()).toBe(3);

    expect(getCount()).toBe(3);
    expect(getCountx2()).toBe(6);

    redo();
    expect(getCount()).toBe(2);
    expect(getCountx2()).toBe(4);
    expect(getTotalPast()).toBe(4);

    typeText('yeet');
    expect(getText()).toBe('yeet');
    expect(getTotalPast()).toBe(5);

    undo();
    expect(getText()).toBe('');
    expect(getCount()).toBe(2);
    expect(getTotalPast()).toBe(4);
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

  it('saves no history', () => {
    const {
      plus,
      minus,
      getCount,
      getTotalPast,
      getTotalFuture,
    } = renderCounter({ manualHistory: true });

    expect(getTotalPast()).toBe(0);
    expect(getTotalFuture()).toBe(0);
    plus();
    expect(getCount()).toBe(1);
    expect(getTotalPast()).toBe(0);
    expect(getTotalFuture()).toBe(0);

    plus();
    plus();
    minus();
    expect(getCount()).toBe(2);
    expect(getTotalPast()).toBe(0);
    expect(getTotalFuture()).toBe(0);
  });

  it('saves history when chosen to', () => {
    const {
      plus,
      minus,
      undo,
      getCount,
      getTotalPast,
      getTotalFuture,
      startSavingHistory,
      stopSavingHistory,
    } = renderCounter({ manualHistory: true });

    expect(getTotalPast()).toBe(0);
    expect(getTotalFuture()).toBe(0);
    startSavingHistory();
    plus();
    expect(getCount()).toBe(1);
    expect(getTotalPast()).toBe(1);
    expect(getTotalFuture()).toBe(0);
    stopSavingHistory();

    plus();
    plus();
    minus();
    expect(getCount()).toBe(2);
    expect(getTotalPast()).toBe(1);
    expect(getTotalFuture()).toBe(0);

    undo();
    expect(getCount()).toBe(0);
    expect(getTotalPast()).toBe(0);
    expect(getTotalFuture()).toBe(1);

    startSavingHistory();
    plus();
    plus();
    plus();
    expect(getCount()).toBe(3);
    expect(getTotalPast()).toBe(2);
    expect(getTotalFuture()).toBe(0);
    stopSavingHistory();
  });
});
