import { ColorName, IconName, toLabel } from './game.model';

describe('toLabel', () => {
  it('should name a color', () => {
    expect(toLabel(ColorName.Red)).toBe('Red');
  });

  it('should name an icon independently of its Material Symbols name', () => {
    expect(toLabel(IconName.Truck)).toBe('Truck');
    expect(toLabel(IconName.Camera)).toBe('Camera');
  });

  it('should name every icon and color', () => {
    [...Object.values(IconName), ...Object.values(ColorName)].forEach(value =>
      expect(toLabel(value)).toMatch(/^[A-Z][a-z]+$/),
    );
  });
});
