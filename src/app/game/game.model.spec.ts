import { ColorName, IconName, toLabel } from './game.model';

describe('toLabel', () => {
  it('should capitalize a single word', () => {
    expect(toLabel(ColorName.Red)).toBe('Red');
  });

  it('should only capitalize the first word', () => {
    expect(toLabel(IconName.FighterJet)).toBe('Fighter jet');
  });
});
