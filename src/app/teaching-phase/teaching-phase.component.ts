import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { hit, miss, reset } from '../store/result.actions';
import { Result } from '../store/result.reducer';

const ROUND_COUNT = 3;

enum IconName {
  Truck = 'truck',
  Beer = 'beer',
  Bed = 'bed',
  Bell = 'bell',
  Briefcase = 'briefcase',
  Bicycle = 'bicycle',
  Binoculars = 'binoculars',
  Bomb = 'bomb',
  Coffee = 'coffee',
  FighterJet = 'fighter jet',
}

enum ColorName {
  Red = 'red',
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue',
  Purple = 'purple',
  Brown = 'brown',
  Grey = 'grey',
  Black = 'black',
  Pink = 'pink',
  Teal = 'teal',
}

enum ComponentState {
  Start = 'start',
  Teach = 'teach',
  TestIcons = 'testIcons',
  TestColors = 'testColors',
  Correct = 'correct',
  False = 'false',
}

@Component({
  selector: 'app-teaching-phase',
  templateUrl: './teaching-phase.component.html',
  styleUrls: ['./teaching-phase.component.css'],
  standalone: true,
})
export class TeachingPhaseComponent implements OnInit {
  readonly iconNames: IconName[] = Object.values(IconName);
  readonly colorNames: ColorName[] = Object.values(ColorName);
  readonly rounds = ROUND_COUNT;
  readonly displayInterval = 3000;

  readonly currentState = signal(ComponentState.Start);
  readonly usedIcons = signal<IconName[]>([]);
  readonly usedColors = signal<ColorName[]>([]);
  readonly guessedIcons = signal<IconName[]>([]);
  readonly guessedColors = signal<ColorName[]>([]);

  readonly roundsCount = computed(() => this.usedIcons().length);
  readonly displayIcon = computed(() => this.usedIcons().at(-1));
  readonly displayColor = computed(() => this.usedColors().at(-1));
  readonly availableIcons = computed(() => this.iconNames.filter(icon => !this.usedIcons().includes(icon)));
  readonly availableColors = computed(() => this.colorNames.filter(color => !this.usedColors().includes(color)));
  readonly solution = computed(() =>
    this.usedIcons().map((icon, index) => ({ icon, color: this.usedColors()[index] })),
  );

  protected readonly ComponentState = ComponentState;

  private readonly router = inject(Router);
  private readonly score = inject<Store<{ result: Result }>>(Store);

  readonly hitCount = this.score.selectSignal(state => state.result.hitCount);
  readonly missCount = this.score.selectSignal(state => state.result.missCount);

  private interval?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTrainingTimer());
  }

  ngOnInit(): void {
    this.startTraining();
  }

  startTraining(): void {
    this.currentState.set(ComponentState.Teach);
    this.teachNext();
    this.stopTrainingTimer();
    this.interval = setInterval(() => this.teachNext(), this.displayInterval);
  }

  restart(): void {
    this.stopTrainingTimer();
    void this.router.navigate(['home']);
  }

  resetStatistics(): void {
    this.score.dispatch(reset());
  }

  teachNext(): void {
    if (this.roundsCount() < this.rounds) {
      this.usedIcons.update(icons => [...icons, this.getRandomElement(this.availableIcons())]);
      this.usedColors.update(colors => [...colors, this.getRandomElement(this.availableColors())]);
      return;
    }

    this.stopTrainingTimer();
    this.currentState.set(ComponentState.TestIcons);
  }

  getRandomElement<T>(elements: T[]): T {
    return elements[this.getRandomIndex(elements.length)];
  }

  getRandomIndex(maxIndex: number): number {
    return Math.floor(Math.random() * maxIndex);
  }

  guessIcon(iconName: IconName): void {
    this.guessedIcons.update(icons => [...icons, iconName]);
    if (this.guessedIcons().length === this.rounds) {
      this.currentState.set(ComponentState.TestColors);
    }
  }

  guessColor(colorName: ColorName): void {
    this.guessedColors.update(colors => [...colors, colorName]);
    if (this.guessedColors().length !== this.rounds) {
      return;
    }

    if (
      this.arrayEquals(this.guessedIcons(), this.usedIcons()) &&
      this.arrayEquals(this.guessedColors(), this.usedColors())
    ) {
      this.currentState.set(ComponentState.Correct);
      this.score.dispatch(hit());
      return;
    }

    this.score.dispatch(miss());
    this.currentState.set(ComponentState.False);
  }

  arrayEquals<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  private stopTrainingTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
