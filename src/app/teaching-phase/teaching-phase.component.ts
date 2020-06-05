import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { hit, miss } from '../store/result.actions';

@Component({
  selector: 'app-teaching-phase',
  templateUrl: './teaching-phase.component.html',
  styleUrls: ['./teaching-phase.component.css']
})
export class TeachingPhaseComponent implements OnInit {
  iconNames: string[];
  colorNames: string[];
  states: string[];
  state: number;
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
  displayInterval = 3000; // millies;
  iconClass: string[];
  colorClass: string[];
  interval: any;

  constructor(private router: Router, private store: Store) {
    this.iconNames = [
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
    this.colorNames = [
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
    this.states = [
      'start',
      'teach',
      'testIcons',
      'testColors',
      'correct',
      'false'
    ];
    this.displayIconIndex = Math.floor(Math.random() * 10);
    this.displayColorIndex = Math.floor(Math.random() * 10);
    this.state = 0;
    this.rounds = 3;
  }

  ngOnInit(): void {
    this.startTraining();
  }

  startTraining() {
    this.teachNext();
    this.interval = setInterval(() => {
      this.teachNext();
    }, this.displayInterval);
    this.state++;
  }

  restart() {
    this.state = 0;
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
      this.state++;
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
    const index: number = Math.floor(Math.random() * maxIndex);
    const digit: string = unusedIndices.charAt(index);
    return Number(digit);
  }

  getState(): string {
    return this.states[this.state];
  }

  guessIcon(index: number) {
    this.guessedIcons += index;
    if (this.guessedIcons.length === this.rounds) {
      this.state++;
    }
  }

  guessColor(index: number) {
    this.guessedColors += index;
    if (this.guessedColors.length === this.rounds) {
      if (
        this.guessedIcons === this.usedIcons &&
        this.guessedColors === this.usedColors
      ) {
        this.state++;
        this.store.dispatch(hit());
        return;
      }
      this.store.dispatch(miss());
      this.state += 2;
    }
  }

  getTrainedIconName(index: number): string {
    return this.iconNames[this.usedIcons.charAt(index)];
  }

  getTrainedColorName(index: number): string {
    return this.colorNames[this.usedColors.charAt(index)];
  }
}
