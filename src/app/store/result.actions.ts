import { createAction } from '@ngrx/store'

export const hit = createAction('[Result] Hit');
export const miss = createAction('[Result] Miss');
export const reset = createAction('[Result] Reset');
