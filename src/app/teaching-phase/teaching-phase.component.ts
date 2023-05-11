import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Result} from '../store/result.reducer';
import {hit, miss} from '../store/result.actions';
import {Observable, Observer} from 'rxjs';

const ICON_COUNT = 10;
const COLOR_COUNT = 10;
const ROUND_COUNT = 3;

@Component({
  selector: 'app-teaching-phase',
  templateUrl: './teaching-phase.component.html',
  styleUrls: ['./teaching-phase.component.css']
})
export class TeachingPhaseComponent implements OnInit {
  iconNames: string[] = [
    'truck',
    'beer',
    'bed',
    'bell',
    'briefcase',
    'bicycle',
    'binoculars',
    'bomb',
    'coffee',
    'fighter jet'
  ];
  colorNames: string[] = [
    'red',
    'yellow',
    'green',
    'blue',
    'purple',
    'brown',
    'grey',
    'black',
    'pink',
    'teal'
  ];
  states: string[] = [
    'start',
    'teach',
    'testIcons',
    'testColors',
    'correct',
    'false'
  ];
  currentState: number;
  numbers = '0123456789';
  colors = '0123456789';
  usedIcons = '';
  usedColors = '';
  guessedIcons = '';
  guessedColors = '';
  displayIconIndex: number;
  displayColorIndex: number;
  rounds: number;
  roundsCount = 0;
  displayInterval = 300; // milliseconds;
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

    this.displayIconIndex = this.getRandomIndex(ICON_COUNT);
    this.displayColorIndex = this.getRandomIndex(COLOR_COUNT);
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
    this.numbers = '0123456789';
    this.colors = '0123456789';
    this.usedIcons = '';
    this.usedColors = '';
    this.guessedIcons = '';
    this.guessedColors = '';
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
    this.numbers = this.numbers.replace(newIndex.toString(), '');
    this.usedIcons = this.usedIcons.concat(newIndex.toString());
    return newIndex;
  }

  getUnusedRandomColorIndex(): number {
    const newIndex: number = this.getUnusedRandomIndex(this.colors);
    this.colors = this.colors.replace(newIndex.toString(), '');
    this.usedColors = this.usedColors.concat(newIndex.toString());
    return newIndex;
  }

  getUnusedRandomIndex(unusedIndices: string): number {
    const maxIndex: number = unusedIndices.length;
    const index: number = this.getRandomIndex(maxIndex);
    const digit: string = unusedIndices.charAt(index);
    return Number(digit);
  }

  getRandomIndex(maxIndex: number): number {
    return Math.floor(Math.random() * maxIndex);
  }

  getState(): string {
    return this.states[this.currentState];
  }

  // User guesses the icon by providing an index
  guessIcon(index: number) {
    this.guessedIcons += index;
    if (this.guessedIcons.length === this.rounds) {
      this.currentState++;
    }
  }

  // User guesses the color by providing an index
  guessColor(index: number) {
    this.guessedColors += index;
    if (this.guessedColors.length === this.rounds) {
      // Check if the guessed icons and colors match the used icons and colors
      if (
        this.guessedIcons === this.usedIcons &&
        this.guessedColors === this.usedColors
      ) {
        this.currentState++;
        this.score.dispatch(hit());
        return;
      }
      this.score.dispatch(miss());
      this.currentState += 2;
    }
  }

  getTrainedIconName(index: number): string {
    return this.iconNames[this.usedIcons.charAt(index)];
  }

  getTrainedColorName(index: number): string {
    return this.colorNames[this.usedColors.charAt(index)];
  }
}
