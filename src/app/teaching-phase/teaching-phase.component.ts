import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Result} from '../store/result.reducer';
import {hit, miss} from '../store/result.actions';
import {Observable, Observer} from 'rxjs';

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
  styleUrls: ['./teaching-phase.component.css']
})
export class TeachingPhaseComponent implements OnInit {
  iconNames: IconName[] = Object.values(IconName);
  colorNames: ColorName[] = Object.values(ColorName);
  states: ComponentState[] = Object.values(ComponentState);
  currentState: number;
  numbers: number[] = Array.from({length: this.iconNames.length}, (_, i) => i);
  colors: number[] = Array.from({length: this.colorNames.length}, (_, i) => i);
  usedIcons: number[] = [];
  usedColors: number[] = [];
  guessedIcons: number[] = [];
  guessedColors: number[] = [];
  displayIconIndex: number;
  displayColorIndex: number;
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

  constructor(private router: Router, private score: Store<{ result: Result }>) {
    this.hitCount$ = this.score.select(state => state.result.hitCount);
    this.missCount$ = this.score.select(state => state.result.missCount);

    this.displayIconIndex = this.getRandomIndex(this.iconNames.length);
    this.displayColorIndex = this.getRandomIndex(this.colorNames.length);
    this.currentState = 0;
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
    this.currentState++;
  }

  restart() {
    this.currentState = 0;
    this.roundsCount = 0;
    this.numbers = Array.from({length: this.iconNames.length}, (_, i) => i);
    this.colors = Array.from({length: this.colorNames.length}, (_, i) => i);
    this.usedIcons = [];
    this.usedColors = [];
    this.guessedIcons = [];
    this.guessedColors = [];
    this.router.navigate(['home']);
  }


  teachNext() {
    if (this.roundsCount < this.rounds) {
      this.displayIconIndex = this.getUnusedRandomIconIndex();
      this.displayColorIndex = this.getUnusedRandomColorIndex();
      this.iconClass = [this.iconNames[this.displayIconIndex]];
      this.colorClass = [this.colorNames[this.displayColorIndex]];
      this.roundsCount++;
    } else {
      clearInterval(this.interval);
      this.currentState++;
    }
  }

  getUnusedRandomIconIndex(): number {
    const newIndex: number = this.getUnusedRandomIndex(this.numbers);
    this.numbers = this.numbers.filter((_, i) => i !== newIndex);
    this.usedIcons.push(newIndex);
    return newIndex;
  }

  getUnusedRandomColorIndex(): number {
    const newIndex: number = this.getUnusedRandomIndex(this.colors);
    this.colors = this.colors.filter((_, i) => i !== newIndex);
    this.usedColors.push(newIndex);
    return newIndex;
  }

  getUnusedRandomIndex(unusedIndices: number[]): number {
    const maxIndex: number = unusedIndices.length;
    const index: number = this.getRandomIndex(maxIndex);
    return unusedIndices[index];
  }

  getRandomIndex(maxIndex: number): number {
    return Math.floor(Math.random() * maxIndex);
  }

  getState(): string {
    return this.states[this.currentState];
  }

  // User guesses the icon by providing an index
  guessIcon(index: number) {
    this.guessedIcons.push(index);
    if (this.guessedIcons.length === this.rounds) {
      this.currentState++;
    }
  }

  // User guesses the color by providing an index
  guessColor(index: number) {
    this.guessedColors.push(index);
    if (this.guessedColors.length === this.rounds) {
      if (
        this.arrayEquals(this.guessedIcons, this.usedIcons) &&
        this.arrayEquals(this.guessedColors, this.usedColors)
      ) {
        this.currentState++;
        this.score.dispatch(hit());
        return;
      }
      this.score.dispatch(miss());
      this.currentState += 2;
    }
  }

  arrayEquals(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  getTrainedIconName(index: number): string {
    return this.iconNames[this.usedIcons[index]];
  }

  getTrainedColorName(index: number): string {
    return this.colorNames[this.usedColors[index]];
  }
}
