import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-teaching-phase",
  templateUrl: "./teaching-phase.component.html",
  styleUrls: ["./teaching-phase.component.css"]
})
export class TeachingPhaseComponent implements OnInit {
  iconNames: string[];
  colorNames: string[];
  states: string[];
  state: number;
  numbers: String = "0123456789";
  colors: String = "0123456789";
  usedIcons: String = "";
  usedColors: String = "";
  guessedIcons: string = "";
  guessedColors: string = "";
  displayIconIndex: number;
  displayColorIndex: number;
  rounds: number;
  roundsCount: number = 0;
  numRoundsReached: boolean;
  displayInterval: number = 3000; // millies;
  iconClass: string[];
  colorClass: string[];
  interval: any;

  constructor() {
    this.iconNames = [
      "truck",
      "beer",
      "bed",
      "bell",
      "briefcase",
      "bicycle",
      "binoculars",
      "bomb",
      "coffee",
      "fighter jet"
    ];
    this.colorNames = [
      "red",
      "yellow",
      "green",
      "blue",
      "purple",
      "brown",
      "grey",
      "black",
      "pink",
      "teal"
    ];
    this.states = [
      "start",
      "teach",
      "testIcons",
      "testColors",
      "correct",
      "false"
    ];
    this.displayIconIndex = Math.floor(Math.random() * 10);
    this.displayColorIndex = Math.floor(Math.random() * 10);
    this.state = 0;
    this.rounds = 3;
  }

  ngOnInit(): void {}

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
    this.numbers = "0123456789";
    this.colors = "0123456789";
    this.usedIcons = "";
    this.usedColors = "";
    this.guessedIcons = "";
    this.guessedColors = "";
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
    let newIndex: number = this.getUnusedRandomIndex(this.numbers);
    this.numbers = this.numbers.replace(newIndex.toString(), "");
    this.usedIcons = this.usedIcons.concat(newIndex.toString());
    return newIndex;
  }

  getUnusedRandomColorIndex(): number {
    let newIndex: number = this.getUnusedRandomIndex(this.colors);
    this.colors = this.colors.replace(newIndex.toString(), "");
    this.usedColors = this.usedColors.concat(newIndex.toString());
    return newIndex;
  }

  getUnusedRandomIndex(unusedIndices: String): number {
    let maxIndex: number = unusedIndices.length;
    let index: number = Math.floor(Math.random() * maxIndex);
    let digit: string = unusedIndices.charAt(index);
    let randomIndex: number = Number.parseInt(digit);
    return randomIndex;
  }

  getState(): string {
    return this.states[this.state];
  }

  guessIcon(index: number) {
    this.guessedIcons += index;
    if (this.guessedIcons.length == this.rounds) {
      this.state++;
    }
  }

  guessColor(index: number) {
    this.guessedColors += index;
    if (this.guessedColors.length == this.rounds) {
      if (
        this.guessedIcons == this.usedIcons &&
        this.guessedColors == this.usedColors
      ) {
        this.state++;
        return;
      }
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
