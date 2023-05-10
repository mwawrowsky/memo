import {Action, createReducer, on} from '@ngrx/store';
import {hit, miss, reset} from './result.actions';

export interface Result {
  hitCount: number;
  missCount: number;
}

export const initialState: Result = {
  hitCount: 0,
  missCount: 0,
};

export const scoreReducer = createReducer(initialState,
  on(hit, result => ({ ...result, hitCount: result.hitCount + 1})),
  on(miss, result => ({ ...result, missCount: result.missCount + 1 })),
  on(reset, () => (initialState))
);

export function reducer(state: Result | undefined, action: Action) {
  return scoreReducer(state, action);
}
