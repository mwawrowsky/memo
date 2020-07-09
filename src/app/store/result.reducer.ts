import { createReducer, on, Action, State } from '@ngrx/store';
import { hit, miss, reset } from './result.actions';

export interface Result {
  hitCount: number;
  missCount: number;
}

export const initialState: Result = {
  hitCount: 0,
  missCount: 0,
};

const _resultReducer = createReducer(initialState,
  on(hit, result => ({ ...result, hitCount: result.hitCount + 1})),
  on(miss, result => ({ ...result, missCount: result.missCount + 1 })),
  on(reset, () => (initialState))
);

export function reducer(state: Result | undefined, action: Action) {
  return _resultReducer(state, action);
}

// export function reducer(state: Result | undefined, action: Action) {
//   switch (action)  {
//       case hit:
//       return  { ...state, hitCount: state.hitCount + 1};
//       case miss:
//       return { ...state, hitCount: state.hitCount + 1};
//   default:
//       return state;
//   }

// }
