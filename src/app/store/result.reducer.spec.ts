import { hit, miss, reset } from './result.actions';
import { initialState, reducer, Result } from './result.reducer';

describe('result reducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = reducer(undefined, { type: '[Test] Unknown' });
    expect(state).toEqual(initialState);
  });

  it('should increment hitCount on hit', () => {
    const state = reducer(initialState, hit());
    expect(state).toEqual({ hitCount: 1, missCount: 0 });
  });

  it('should increment missCount on miss', () => {
    const state = reducer(initialState, miss());
    expect(state).toEqual({ hitCount: 0, missCount: 1 });
  });

  it('should not mutate the previous state', () => {
    const before: Result = { hitCount: 2, missCount: 3 };
    const after = reducer(before, hit());
    expect(before).toEqual({ hitCount: 2, missCount: 3 });
    expect(after).not.toBe(before);
  });

  it('should restore the initial state on reset', () => {
    const state = reducer({ hitCount: 5, missCount: 7 }, reset());
    expect(state).toEqual(initialState);
  });
});
