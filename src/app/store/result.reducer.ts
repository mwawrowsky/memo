import { createReducer, on, Action, State } from '@ngrx/store';
import { hit, miss } from './result.actions';

export interface result {
  hitCount: number;
  missCount: number;
}

export const initialState: result = {
  hitCount: 0,
  missCount: 0,
};

const _resultReducer = createReducer(initialState,
  on(hit, result => ({ ...result, hitCount: result.hitCount + 1})),
  on(miss, state => ({ ...state, missCount: state.missCount + 1}))
);

export function resultReducer(state: result, action: Action) {
  return _resultReducer(state, action);
}
