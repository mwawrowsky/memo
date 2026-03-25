import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { hit, miss } from '../store/result.actions';
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
  imports: [AsyncPipe],
})
export class TeachingPhaseComponent implements OnInit, OnDestroy {
  readonly iconNames: IconName[] = Object.values(IconName);
  readonly colorNames: ColorName[] = Object.values(ColorName);
  readonly hitCount$: Observable<number>;
  readonly missCount$: Observable<number>;

  currentState = ComponentState.Start;
  availableIcons: IconName[] = [...this.iconNames];
  availableColors: ColorName[] = [...this.colorNames];
  usedIcons: IconName[] = [];
  usedColors: ColorName[] = [];
  guessedIcons: IconName[] = [];
  guessedColors: ColorName[] = [];
  displayIcon: IconName = this.iconNames[0];
  displayColor: ColorName = this.colorNames[0];
  rounds = ROUND_COUNT;
  roundsCount = 0;
  displayInterval = 3000;
  interval?: ReturnType<typeof setInterval>;

  protected readonly ComponentState = ComponentState;

  private readonly router = inject(Router);
  private readonly score = inject<Store<{ result: Result }>>(Store);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.hitCount$ = this.score.select(state => state.result.hitCount);
    this.missCount$ = this.score.select(state => state.result.missCount);
  }

  ngOnInit(): void {
    this.startTraining();
  }

  ngOnDestroy(): void {
    this.stopTrainingTimer();
  }

  startTraining(): void {
    this.currentState = ComponentState.Teach;
    this.teachNext();
    this.stopTrainingTimer();
    this.interval = setInterval(() => this.teachNext(), this.displayInterval);
  }

  restart(): void {
    this.stopTrainingTimer();
    this.currentState = ComponentState.Teach;
    this.roundsCount = 0;
    this.availableIcons = [...this.iconNames];
    this.availableColors = [...this.colorNames];
    this.usedIcons = [];
    this.usedColors = [];
    this.guessedIcons = [];
    this.guessedColors = [];
    void this.router.navigate(['home']);
  }

  teachNext(): void {
    if (this.roundsCount < this.rounds) {
      this.displayIcon = this.getUnusedRandomIcon();
      this.displayColor = this.getUnusedRandomColor();
      this.roundsCount++;
      this.cdr.detectChanges();
      return;
    }

    this.stopTrainingTimer();
    this.currentState = ComponentState.TestIcons;
    this.cdr.detectChanges();
  }

  getUnusedRandomIcon(): IconName {
    const newIcon = this.getUnusedRandomElement(this.availableIcons);
    this.availableIcons = this.availableIcons.filter(icon => icon !== newIcon);
    this.usedIcons.push(newIcon);
    return newIcon;
  }

  getUnusedRandomColor(): ColorName {
    const newColor = this.getUnusedRandomElement(this.availableColors);
    this.availableColors = this.availableColors.filter(color => color !== newColor);
    this.usedColors.push(newColor);
    return newColor;
  }

  getUnusedRandomElement<T>(elements: T[]): T {
    return elements[this.getRandomIndex(elements.length)];
  }

  getRandomIndex(maxIndex: number): number {
    return Math.floor(Math.random() * maxIndex);
  }

  guessIcon(iconName: IconName): void {
    this.guessedIcons.push(iconName);
    if (this.guessedIcons.length === this.rounds) {
      this.currentState = ComponentState.TestColors;
    }
  }

  guessColor(colorName: ColorName): void {
    this.guessedColors.push(colorName);
    if (this.guessedColors.length !== this.rounds) {
      return;
    }

    if (this.arrayEquals(this.guessedIcons, this.usedIcons) && this.arrayEquals(this.guessedColors, this.usedColors)) {
      this.currentState = ComponentState.Correct;
      this.score.dispatch(hit());
      return;
    }

    this.score.dispatch(miss());
    this.currentState = ComponentState.False;
  }

  arrayEquals<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  getTrainedIconName(index: number): string {
    return this.usedIcons[index];
  }

  getTrainedColorName(index: number): string {
    return this.usedColors[index];
  }

  private stopTrainingTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
