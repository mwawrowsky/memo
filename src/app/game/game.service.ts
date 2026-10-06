import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';

import { hit, miss } from '../store/result.actions';
import { Result } from '../store/result.reducer';
import { ColorName, GameState, IconName, SolutionStep } from './game.model';

const ROUND_COUNT = 3;
const DISPLAY_INTERVAL_MS = 3000;

/**
 * Runs one memo game: shows a random sequence of icon/color pairs, collects the
 * player's guesses and reports the result to the store.
 *
 * Provided per component, so every game starts with a fresh state and its timer
 * is stopped when the hosting component is destroyed.
 */
@Injectable()
export class GameService {
  readonly iconNames: IconName[] = Object.values(IconName);
  readonly colorNames: ColorName[] = Object.values(ColorName);
  readonly rounds = ROUND_COUNT;
  readonly displayInterval = DISPLAY_INTERVAL_MS;

  private readonly stateSignal = signal(GameState.Start);
  private readonly usedIconsSignal = signal<IconName[]>([]);
  private readonly usedColorsSignal = signal<ColorName[]>([]);
  private readonly guessedIconsSignal = signal<IconName[]>([]);
  private readonly guessedColorsSignal = signal<ColorName[]>([]);

  readonly state = this.stateSignal.asReadonly();
  readonly usedIcons = this.usedIconsSignal.asReadonly();
  readonly usedColors = this.usedColorsSignal.asReadonly();
  readonly guessedIcons = this.guessedIconsSignal.asReadonly();
  readonly guessedColors = this.guessedColorsSignal.asReadonly();

  readonly roundsCount = computed(() => this.usedIcons().length);
  readonly displayIcon = computed(() => this.usedIcons().at(-1));
  readonly displayColor = computed(() => this.usedColors().at(-1));
  readonly availableIcons = computed(() => this.iconNames.filter(icon => !this.usedIcons().includes(icon)));
  readonly availableColors = computed(() => this.colorNames.filter(color => !this.usedColors().includes(color)));
  readonly solution = computed<SolutionStep[]>(() =>
    this.usedIcons().map((icon, index) => ({ icon, color: this.usedColors()[index] })),
  );

  private readonly store = inject<Store<{ result: Result }>>(Store);
  private interval?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Starts the teaching phase: shows the first pair now and the next ones on a timer. */
  start(): void {
    this.stateSignal.set(GameState.Teach);
    this.teachNext();
    this.stop();
    this.interval = setInterval(() => this.teachNext(), this.displayInterval);
  }

  /** Stops the teaching timer. */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  guessIcon(iconName: IconName): void {
    this.guessedIconsSignal.update(icons => [...icons, iconName]);
    if (this.guessedIcons().length === this.rounds) {
      this.stateSignal.set(GameState.TestColors);
    }
  }

  guessColor(colorName: ColorName): void {
    this.guessedColorsSignal.update(colors => [...colors, colorName]);
    if (this.guessedColors().length !== this.rounds) {
      return;
    }

    if (sameOrder(this.guessedIcons(), this.usedIcons()) && sameOrder(this.guessedColors(), this.usedColors())) {
      this.stateSignal.set(GameState.Correct);
      this.store.dispatch(hit());
      return;
    }

    this.store.dispatch(miss());
    this.stateSignal.set(GameState.False);
  }

  private teachNext(): void {
    if (this.roundsCount() < this.rounds) {
      this.usedIconsSignal.update(icons => [...icons, randomElement(this.availableIcons())]);
      this.usedColorsSignal.update(colors => [...colors, randomElement(this.availableColors())]);
      return;
    }

    this.stop();
    this.stateSignal.set(GameState.TestIcons);
  }
}

function randomElement<T>(elements: T[]): T {
  return elements[Math.floor(Math.random() * elements.length)];
}

function sameOrder<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}
