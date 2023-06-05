import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Result} from '../store/result.reducer';
import {hit, miss} from '../store/result.actions';
import {Observable, Observer} from 'rxjs';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';

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
  // Add more icons here
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
  // Add more colors here
}

enum ComponentState {
  Start = 'start',
  Teach = 'teach',
  TestIcons = 'testIcons',
  TestColors = 'testColors',
  Correct = 'correct',
  False = 'false'
}

@Component({
    selector: 'app-teaching-phase',
    templateUrl: './teaching-phase.component.html',
    styleUrls: ['./teaching-phase.component.css'],
    standalone: true,
    imports: [NgIf, NgClass, NgFor, AsyncPipe]
})
export class TeachingPhaseComponent implements OnInit {
  iconNames: IconName[] = Object.values(IconName);
  colorNames: ColorName[] = Object.values(ColorName);
  currentState: ComponentState;
  availableIcons: IconName[] = [...this.iconNames];
  availableColors: ColorName[] = [...this.colorNames];
  usedIcons: IconName[] = [];
  usedColors: ColorName[] = [];
  guessedIcons: IconName[] = [];
  guessedColors: ColorName[] = [];
  displayIcon: IconName;
  displayColor: ColorName;
  rounds: number;
  roundsCount = 0;
  displayInterval = 3000; // milliseconds;
  iconClass: string[];
  colorClass: string[];
  interval: any;
  hitCount$: Observable<number>;
  missCount$: Observable<number>;
  hitCount: number;
  time = new Observable<string>((observer: Observer<string>) => {
    setInterval(() => observer.next(new Date().toString()), 1000);
  });

  protected readonly ComponentState = ComponentState;


  constructor(private router: Router, private score: Store<{ result: Result }>) {
    this.hitCount$ = this.score.select(state => state.result.hitCount);
    this.missCount$ = this.score.select(state => state.result.missCount);
    this.currentState = ComponentState.Start;
    this.rounds = ROUND_COUNT;
  }

  ngOnInit(): void {
    this.startTraining();
    console.log('component initialized');
  }

  startTraining() {
    this.teachNext();
    this.interval = setInterval(() => {
      this.teachNext();
    }, this.displayInterval);
    this.currentState = ComponentState.Teach;
  }

  restart() {
    this.currentState = ComponentState.Teach;
    this.roundsCount = 0;
    this.availableIcons = [...this.iconNames];
    this.availableColors = [...this.colorNames];
    this.usedIcons = [];
    this.usedColors = [];
    this.guessedIcons = [];
    this.guessedColors = [];
    this.router.navigate(['home']);
  }


  teachNext() {
    if (this.roundsCount < this.rounds) {
      this.displayIcon = this.getUnusedRandomIcon();
      this.displayColor = this.getUnusedRandomColor();
      this.iconClass = [this.displayIcon];
      this.colorClass = [this.displayColor];
      this.roundsCount++;
    } else {
      clearInterval(this.interval);
      this.currentState = ComponentState.TestIcons;
    }
  }

  getUnusedRandomIcon(): IconName {
    const newIcon: IconName = this.getUnusedRandomElement(this.availableIcons);
    this.availableIcons = this.availableIcons.filter(icon => icon !== newIcon);
    this.usedIcons.push(newIcon);
    return newIcon;
  }

  getUnusedRandomColor(): ColorName {
    const newColor: ColorName = this.getUnusedRandomElement(this.availableColors);
    this.availableColors = this.availableColors.filter(color => color !== newColor);
    this.usedColors.push(newColor);
    return newColor;
  }

  getUnusedRandomElement<T>(elements: T[]): T {
    const index: number = this.getRandomIndex(elements.length);
    return elements[index];
  }

  getRandomIndex(maxIndex: number): number {
    return Math.floor(Math.random() * maxIndex);
  }

  getState(): string {
    return this.currentState;
  }

  // User guesses the icon by providing an icon name
  guessIcon(iconName: IconName) {
    this.guessedIcons.push(iconName);
    if (this.guessedIcons.length === this.rounds) {
      this.currentState = ComponentState.TestColors;
    }
  }

  // User guesses the color by providing a color name
  guessColor(colorName: ColorName) {
    this.guessedColors.push(colorName);
    if (this.guessedColors.length === this.rounds) {
      if (
        this.arrayEquals(this.guessedIcons, this.usedIcons) &&
        this.arrayEquals(this.guessedColors, this.usedColors)
      ) {
        this.currentState = ComponentState.Correct;
        this.score.dispatch(hit());
        return;
      }
      this.score.dispatch(miss());
      this.currentState = ComponentState.False;
    }
  }

  arrayEquals(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  getTrainedIconName(index: number): string {
    return this.usedIcons[index];
  }

  getTrainedColorName(index: number): string {
    return this.usedColors[index];
  }
}
