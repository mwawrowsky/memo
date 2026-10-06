import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';

import { TeachingPhaseComponent } from './teaching-phase.component';
import { GameService } from '../game/game.service';
import { GameState, toLabel } from '../game/game.model';
import { reducer, Result } from '../store/result.reducer';

describe('TeachingPhaseComponent', () => {
  let fixture: ComponentFixture<TeachingPhaseComponent>;
  let component: TeachingPhaseComponent;
  let game: GameService;
  let store: Store<{ result: Result }>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const heading = (): string | undefined => element().querySelector('h1')?.textContent ?? undefined;
  const gridButtons = (): HTMLButtonElement[] =>
    Array.from(element().querySelectorAll<HTMLButtonElement>('.ui.grid button'));

  // Lets the teaching interval run until every round has been shown.
  const finishTeaching = (): void => {
    jasmine.clock().tick(game.displayInterval * game.rounds);
  };

  // Plays a whole game through the service; `correct` decides the icon order.
  const playGame = (correct: boolean): void => {
    finishTeaching();
    const icons = correct ? game.usedIcons() : [...game.usedIcons()].reverse();
    [...icons].forEach(icon => game.guessIcon(icon));
    [...game.usedColors()].forEach(color => game.guessColor(color));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    // The game drives the teaching phase with setInterval.
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
    game = component.game;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get its own game instance', () => {
    expect(fixture.debugElement.injector.get(GameService)).toBe(game);
  });

  describe('teaching phase', () => {
    it('should start the game on init', () => {
      expect(game.state()).toBe(GameState.Teach);
      expect(game.roundsCount()).toBe(1);
    });

    it('should render the current icon with its background color', () => {
      const item = element().querySelector('.memo-item [role="img"]');
      const icon = item?.querySelector('i');

      expect(heading()).toContain('Teaching Phase');
      expect(item?.classList).toContain(game.displayColor() ?? '');
      (game.displayIcon() ?? '').split(' ').forEach(cls => expect(icon?.classList).toContain(cls));
    });

    it('should describe the current icon and color for screen readers', () => {
      const item = element().querySelector('.memo-item [role="img"]');
      const icon = game.displayIcon() ?? game.iconNames[0];
      const color = game.displayColor() ?? game.colorNames[0];

      expect(item?.getAttribute('aria-label')).toBe(`${toLabel(icon)} on ${toLabel(color)}`);
      expect(item?.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
      expect(element().querySelector('[aria-live]')?.contains(item ?? null)).toBeTrue();
    });

    it('should show the color name as text', () => {
      expect(element().querySelector('.memo-item .color-name')?.textContent?.trim()).toBe(
        toLabel(game.displayColor() ?? game.colorNames[0]),
      );
    });

    it('should not render the displayed item as a button', () => {
      expect(element().querySelectorAll('button').length).toBe(0);
    });

    it('should render the next round when the timer fires', async () => {
      const firstIcon = game.displayIcon();
      jasmine.clock().tick(game.displayInterval);
      await fixture.whenStable();

      const icon = element().querySelector('.memo-item i');
      expect(game.displayIcon()).not.toBe(firstIcon);
      (game.displayIcon() ?? '').split(' ').forEach(cls => expect(icon?.classList).toContain(cls));
    });
  });

  describe('testing phase', () => {
    beforeEach(() => {
      finishTeaching();
      fixture.detectChanges();
    });

    it('should offer every icon to choose from', () => {
      expect(heading()).toContain('Testing Phase');
      expect(gridButtons().length).toBe(game.iconNames.length);
    });

    it('should name every icon button', () => {
      expect(gridButtons().map(button => button.getAttribute('aria-label'))).toEqual(game.iconNames.map(toLabel));
      gridButtons().forEach(button => expect(button.querySelector('i')?.getAttribute('aria-hidden')).toBe('true'));
    });

    it('should show the color names on the color buttons', () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      expect(gridButtons().map(button => button.textContent?.trim())).toEqual(game.colorNames.map(toLabel));
    });

    it('should tell which test is running', () => {
      expect(element().textContent).toContain('Click the icons in the order of appearance.');

      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      expect(element().textContent).toContain('Click the colors in the order of appearance.');
    });

    it('should record a guess when an icon button is clicked', () => {
      gridButtons()[0].click();

      expect(game.guessedIcons()).toEqual([game.iconNames[0]]);
    });

    it('should offer every color after all icons were guessed', () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      expect(gridButtons().length).toBe(game.colorNames.length);
      gridButtons().forEach((button, idx) => expect(button.classList).toContain(game.colorNames[idx]));
    });

    it('should record a guess when a color button is clicked', () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      gridButtons()[0].click();

      expect(game.guessedColors()).toEqual([game.colorNames[0]]);
    });
  });

  describe('guess input', () => {
    const iconButton = (icon: string): HTMLButtonElement | undefined =>
      gridButtons().find(button => icon.split(' ').every(cls => button.querySelector('i')?.classList.contains(cls)));
    const undoButton = (): HTMLButtonElement | null => element().querySelector<HTMLButtonElement>('button.undo-guess');
    const progressText = (): string | undefined => element().querySelector('.guess-count')?.textContent?.trim();

    beforeEach(async () => {
      finishTeaching();
      await fixture.whenStable();
    });

    it('should show the progress and disable undo before the first guess', () => {
      expect(progressText()).toBe(`0 of ${game.rounds} selected`);
      expect(undoButton()?.disabled).toBeTrue();
      expect(gridButtons().every(button => !button.disabled)).toBeTrue();
    });

    it('should disable a guessed icon and show it in the progress', async () => {
      const [first] = game.usedIcons();
      iconButton(first)?.click();
      await fixture.whenStable();

      expect(iconButton(first)?.disabled).toBeTrue();
      expect(progressText()).toBe(`1 of ${game.rounds} selected`);
      expect(element().querySelectorAll('.guess-step').length).toBe(1);
      expect(element().querySelector('.guess-step')?.getAttribute('aria-label')).toBe(toLabel(first));
      expect(undoButton()?.disabled).toBeFalse();
    });

    it('should re-enable an icon after undo', async () => {
      const [first] = game.usedIcons();
      iconButton(first)?.click();
      await fixture.whenStable();

      undoButton()?.click();
      await fixture.whenStable();

      expect(iconButton(first)?.disabled).toBeFalse();
      expect(progressText()).toBe(`0 of ${game.rounds} selected`);
      expect(element().querySelectorAll('.guess-step').length).toBe(0);
    });

    it('should disable a guessed color and color the preview', async () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      await fixture.whenStable();

      const [firstColor] = game.usedColors();
      const colorButton = (): HTMLButtonElement | undefined =>
        gridButtons().find(button => button.classList.contains(firstColor));
      colorButton()?.click();
      await fixture.whenStable();

      expect(colorButton()?.disabled).toBeTrue();
      expect(element().querySelectorAll('.guess-step').length).toBe(game.rounds);
      expect(element().querySelector('.guess-step')?.classList).toContain(firstColor);
      expect(element().querySelector('.guess-step')?.getAttribute('aria-label')).toBe(
        `${toLabel(game.usedIcons()[0])} on ${toLabel(firstColor)}`,
      );
    });
  });

  describe('result', () => {
    it('should congratulate after a correct game', () => {
      playGame(true);

      expect(heading()).toContain('Congratulations!');
    });

    it('should apologize after a wrong game', () => {
      playGame(false);

      expect(heading()).toContain('Sorry');
    });

    it('should show the solution', () => {
      playGame(true);

      const solutionItems = Array.from(element().querySelectorAll('ol.solution [role="img"]'));
      expect(solutionItems.length).toBe(game.rounds);
      solutionItems.forEach((item, idx) => {
        expect(item.classList).toContain(game.usedColors()[idx]);
        game.usedIcons()[idx].split(' ').forEach(cls => expect(item.querySelector('i')?.classList).toContain(cls));
      });
    });

    it('should describe the solution for screen readers', () => {
      playGame(true);

      const labels = Array.from(element().querySelectorAll('ol.solution [role="img"]')).map(item =>
        item.getAttribute('aria-label'),
      );
      expect(labels).toEqual(game.solution().map(step => `${toLabel(step.icon)} on ${toLabel(step.color)}`));
      expect(Array.from(element().querySelectorAll('ol.solution .color-name')).map(c => c.textContent?.trim())).toEqual(
        game.usedColors().map(toLabel),
      );
    });

    it('should only offer restart and reset as buttons', () => {
      playGame(true);

      expect(Array.from(element().querySelectorAll('button')).map(b => b.textContent?.trim())).toEqual([
        'Restart',
        'Reset statistics',
      ]);
    });

    it('should show the hit/miss ratio', () => {
      playGame(true);

      expect(element().textContent).toContain('Your hit/miss ratio is 1 : 0.');
    });
  });

  describe('restart', () => {
    it('should stop the game and navigate home', () => {
      const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      component.restart();
      finishTeaching();

      expect(navigateSpy).toHaveBeenCalledOnceWith(['home']);
      expect(game.roundsCount()).toBe(1);
    });
  });

  describe('reset statistics', () => {
    const result = (): Promise<Result> => firstValueFrom(store.select(state => state.result));

    beforeEach(() => playGame(true));

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
    it('should stop the game timer when the component is destroyed', () => {
      fixture.destroy();

      expect(() => finishTeaching()).not.toThrow();
      expect(game.roundsCount()).toBe(1);
    });
  });
});
