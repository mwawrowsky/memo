export enum IconName {
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

export enum ColorName {
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

export enum GameState {
  Start = 'start',
  Teach = 'teach',
  TestIcons = 'testIcons',
  TestColors = 'testColors',
  Correct = 'correct',
  False = 'false',
}

export interface SolutionStep {
  icon: IconName;
  color: ColorName;
}

export interface GuessStep {
  icon: IconName;
  color?: ColorName;
}

/** Human-readable name of an icon or color, e.g. "Fighter jet" for 'fighter jet'. */
export function toLabel(value: IconName | ColorName): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
