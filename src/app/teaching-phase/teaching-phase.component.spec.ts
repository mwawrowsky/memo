import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';

import { TeachingPhaseComponent } from './teaching-phase.component';
import { reducer, Result } from '../store/result.reducer';

describe('TeachingPhaseComponent', () => {
  let component: TeachingPhaseComponent;
  let fixture: ComponentFixture<TeachingPhaseComponent>;
  let store: Store<{ result: Result }>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  // Lets the teaching interval run until every round has been shown.
  const finishTeaching = (): void => {
    jasmine.clock().tick(component.displayInterval * component.rounds);
  };

  const guessAllIcons = (icons = component.usedIcons()): void => {
    [...icons].forEach(icon => component.guessIcon(icon));
  };

  const guessAllColors = (colors = component.usedColors()): void => {
    [...colors].forEach(color => component.guessColor(color));
  };

  beforeEach(async () => {
    // The component drives the teaching phase with setInterval.
    jasmine.clock().install();

    await TestBed.configureTestingModule({
      imports: [TeachingPhaseComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStore({ result: reducer }),
      ],
    }).compileComponents();

    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(TeachingPhaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('teaching phase', () => {
    it('should start teaching immediately with the first round', () => {
      expect(component.currentState() as string).toBe('teach');
      expect(component.roundsCount()).toBe(1);
      expect(component.usedIcons().length).toBe(1);
      expect(component.usedColors().length).toBe(1);
    });

    it('should render the current icon with its background color', () => {
      const button = element().querySelector('button');
      const icon = button?.querySelector('i');

      expect(element().querySelector('h1')?.textContent).toContain('Teaching Phase');
      expect(button?.classList).toContain(component.displayColor());
      (component.displayIcon() ?? '').split(' ').forEach(cls => expect(icon?.classList).toContain(cls));
    });

    it('should render the next round when the timer fires', async () => {
      const firstIcon = component.displayIcon();
      jasmine.clock().tick(component.displayInterval);
      await fixture.whenStable();

      const icon = element().querySelector('button i');
      expect(component.displayIcon()).not.toBe(firstIcon);
      (component.displayIcon() ?? '').split(' ').forEach(cls => expect(icon?.classList).toContain(cls));
    });

    it('should show the next round after each display interval', () => {
      jasmine.clock().tick(component.displayInterval);
      expect(component.roundsCount()).toBe(2);
      expect(component.currentState() as string).toBe('teach');
    });

    it('should switch to the icon test after all rounds were shown', () => {
      finishTeaching();

      expect(component.currentState() as string).toBe('testIcons');
      expect(component.usedIcons().length).toBe(component.rounds);
      expect(component.usedColors().length).toBe(component.rounds);
    });

    it('should never repeat an icon or a color within one game', () => {
      finishTeaching();

      expect(new Set(component.usedIcons()).size).toBe(component.rounds);
      expect(new Set(component.usedColors()).size).toBe(component.rounds);
    });

    it('should remove used icons and colors from the available pool', () => {
      finishTeaching();

      component.usedIcons().forEach(icon => expect(component.availableIcons()).not.toContain(icon));
      component.usedColors().forEach(color => expect(component.availableColors()).not.toContain(color));
      expect(component.availableIcons().length).toBe(component.iconNames.length - component.rounds);
      expect(component.availableColors().length).toBe(component.colorNames.length - component.rounds);
    });
  });

  describe('testing phase', () => {
    beforeEach(() => {
      finishTeaching();
      fixture.detectChanges();
    });

    it('should offer every icon to choose from', () => {
      expect(element().querySelectorAll('.ui.grid button').length).toBe(component.iconNames.length);
    });

    it('should switch to the color test after all icons were guessed', () => {
      guessAllIcons();
      fixture.detectChanges();

      expect(component.currentState() as string).toBe('testColors');
      expect(element().querySelectorAll('.ui.grid button').length).toBe(component.colorNames.length);
    });

    it('should stay in the icon test until all icons were guessed', () => {
      component.guessIcon(component.usedIcons()[0]);
      expect(component.currentState() as string).toBe('testIcons');
    });

    it('should record a guess when an icon button is clicked', () => {
      const firstButton = element().querySelector<HTMLButtonElement>('.ui.grid button');
      firstButton?.click();

      expect(component.guessedIcons()).toEqual([component.iconNames[0]]);
    });

    it('should report success and count a hit for the correct sequence', async () => {
      guessAllIcons();
      guessAllColors();
      fixture.detectChanges();

      expect(component.currentState() as string).toBe('correct');
      expect(element().querySelector('h1')?.textContent).toContain('Congratulations!');
      expect(await firstValueFrom(store.select(state => state.result))).toEqual({
        hitCount: 1,
        missCount: 0,
      });
    });

    it('should report failure and count a miss when the icon order is wrong', async () => {
      guessAllIcons([...component.usedIcons()].reverse());
      guessAllColors();
      fixture.detectChanges();

      expect(component.currentState() as string).toBe('false');
      expect(element().querySelector('h1')?.textContent).toContain('Sorry');
      expect(await firstValueFrom(store.select(state => state.result))).toEqual({
        hitCount: 0,
        missCount: 1,
      });
    });

    it('should report failure when the color order is wrong', () => {
      guessAllIcons();
      guessAllColors([...component.usedColors()].reverse());

      expect(component.currentState() as string).toBe('false');
    });

    it('should show the solution after the game ended', () => {
      guessAllIcons();
      guessAllColors();
      fixture.detectChanges();

      const solutionButtons = Array.from(
        element().querySelectorAll<HTMLButtonElement>('.ui.grid .three.wide.column button'),
      );
      expect(solutionButtons.length).toBe(component.rounds);
      solutionButtons.forEach((button, idx) =>
        expect(button.classList).toContain(component.usedColors()[idx]),
      );
    });

    it('should show the hit/miss ratio after the game ended', () => {
      guessAllIcons();
      guessAllColors();
      fixture.detectChanges();

      expect(element().textContent).toContain('Your hit/miss ratio is 1 : 0.');
    });
  });

  describe('restart', () => {
    it('should navigate home', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
      finishTeaching();
      guessAllIcons();
      guessAllColors();

      component.restart();

      expect(navigateSpy).toHaveBeenCalledOnceWith(['home']);
    });

    it('should stop the teaching timer when restarting during the teaching phase', () => {
      spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      component.restart();
      jasmine.clock().tick(component.displayInterval * component.rounds);

      expect(component.roundsCount()).toBe(1);
    });
  });

  describe('reset statistics', () => {
    const result = (): Promise<Result> => firstValueFrom(store.select(state => state.result));

    beforeEach(() => {
      finishTeaching();
      guessAllIcons();
      guessAllColors();
      fixture.detectChanges();
    });

    it('should reset the hit/miss counters in the store', async () => {
      expect(await result()).toEqual({ hitCount: 1, missCount: 0 });

      element().querySelector<HTMLButtonElement>('button.reset-statistics')?.click();

      expect(await result()).toEqual({ hitCount: 0, missCount: 0 });
    });

    it('should show the reset ratio', async () => {
      element().querySelector<HTMLButtonElement>('button.reset-statistics')?.click();
      await fixture.whenStable();

      expect(element().textContent).toContain('Your hit/miss ratio is 0 : 0.');
    });
  });

  describe('destroy', () => {
    it('should stop the teaching timer when the component is destroyed', () => {
      fixture.destroy();

      expect(() => jasmine.clock().tick(component.displayInterval * component.rounds)).not.toThrow();
      expect(component.roundsCount()).toBe(1);
    });
  });

  describe('arrayEquals', () => {
    it('should be true for arrays with the same elements in the same order', () => {
      expect(component.arrayEquals([1, 2, 3], [1, 2, 3])).toBeTrue();
    });

    it('should be false for a different order', () => {
      expect(component.arrayEquals([1, 2, 3], [3, 2, 1])).toBeFalse();
    });

    it('should be false for different lengths', () => {
      expect(component.arrayEquals([1, 2], [1, 2, 3])).toBeFalse();
    });
  });

  describe('teaching state', () => {
    it('should derive the displayed icon and color from the latest round', () => {
      jasmine.clock().tick(component.displayInterval);

      expect(component.displayIcon()).toBe(component.usedIcons()[1]);
      expect(component.displayColor()).toBe(component.usedColors()[1]);
    });

    it('should pair icons and colors in the solution', () => {
      finishTeaching();

      expect(component.solution()).toEqual(
        component.usedIcons().map((icon, index) => ({ icon, color: component.usedColors()[index] })),
      );
    });
  });

  describe('getRandomIndex', () => {
    it('should return an index within bounds', () => {
      spyOn(Math, 'random').and.returnValues(0, 0.999);
      expect(component.getRandomIndex(10)).toBe(0);
      expect(component.getRandomIndex(10)).toBe(9);
    });
  });
});
