/** Game icons; the values are Material Symbols names. */
export enum IconName {
  Truck = 'local_shipping',
  Beer = 'sports_bar',
  Bed = 'bed',
  Bell = 'notifications',
  Briefcase = 'work',
  Bicycle = 'pedal_bike',
  Camera = 'photo_camera',
  Bomb = 'bomb',
  Coffee = 'coffee',
  Plane = 'flight',
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

const LABELS: Record<IconName | ColorName, string> = {
  [IconName.Truck]: 'Truck',
  [IconName.Beer]: 'Beer',
  [IconName.Bed]: 'Bed',
  [IconName.Bell]: 'Bell',
  [IconName.Briefcase]: 'Briefcase',
  [IconName.Bicycle]: 'Bicycle',
  [IconName.Camera]: 'Camera',
  [IconName.Bomb]: 'Bomb',
  [IconName.Coffee]: 'Coffee',
  [IconName.Plane]: 'Plane',
  [ColorName.Red]: 'Red',
  [ColorName.Yellow]: 'Yellow',
  [ColorName.Green]: 'Green',
  [ColorName.Blue]: 'Blue',
  [ColorName.Purple]: 'Purple',
  [ColorName.Brown]: 'Brown',
  [ColorName.Grey]: 'Grey',
  [ColorName.Black]: 'Black',
  [ColorName.Pink]: 'Pink',
  [ColorName.Teal]: 'Teal',
};

/** Human-readable name of an icon or color, e.g. "Truck" for 'local_shipping'. */
export function toLabel(value: IconName | ColorName): string {
  return LABELS[value];
}
