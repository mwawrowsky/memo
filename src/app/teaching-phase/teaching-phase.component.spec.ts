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
  const choiceButtons = (): HTMLButtonElement[] =>
    Array.from(element().querySelectorAll<HTMLButtonElement>('.choices button'));
  // Material Symbols are ligatures: the icon name is the text of the <mat-icon>.
  const iconName = (parent: Element | null | undefined): string | undefined =>
    parent?.querySelector('mat-icon')?.textContent?.trim();

  // Lets the teaching interval run until every round has been shown.
  const finishTeaching = (): void => {
    vi.advanceTimersByTime(game.displayInterval * game.rounds);
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
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

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
    vi.useRealTimers();
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
      const item = element().querySelector('.stage [role="img"]');

      expect(heading()).toContain('Teaching Phase');
      expect(item?.classList).toContain(game.displayColor() ?? '');
      expect(iconName(item)).toBe(game.displayIcon());
    });

    it('should describe the current icon and color for screen readers', () => {
      const item = element().querySelector('.stage [role="img"]');
      const icon = game.displayIcon() ?? game.iconNames[0];
      const color = game.displayColor() ?? game.colorNames[0];

      expect(item?.getAttribute('aria-label')).toBe(`${toLabel(icon)} on ${toLabel(color)}`);
      expect(item?.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
      expect(element().querySelector('[aria-live]')?.contains(item ?? null)).toBe(true);
    });

    it('should not show the color name as visible text', () => {
      // The only text is the icon ligature.
      expect(element().querySelector('.stage')?.textContent?.trim()).toBe(game.displayIcon());
    });

    it('should not render the displayed item as a button', () => {
      expect(element().querySelectorAll('button').length).toBe(0);
    });

    it('should render the next round when the timer fires', async () => {
      const firstIcon = game.displayIcon();
      vi.advanceTimersByTime(game.displayInterval);
      await fixture.whenStable();

      expect(game.displayIcon()).not.toBe(firstIcon);
      expect(iconName(element().querySelector('.stage'))).toBe(game.displayIcon());
    });
  });

  describe('testing phase', () => {
    beforeEach(() => {
      finishTeaching();
      fixture.detectChanges();
    });

    it('should offer every icon to choose from', () => {
      expect(heading()).toContain('Testing Phase');
      expect(choiceButtons().length).toBe(game.iconNames.length);
    });

    it('should name every icon button', () => {
      expect(choiceButtons().map(button => button.getAttribute('aria-label'))).toEqual(game.iconNames.map(toLabel));
      choiceButtons().forEach(button => expect(button.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true'));
      expect(choiceButtons().map(button => iconName(button))).toEqual(game.iconNames);
    });

    it('should name the color buttons for screen readers only', () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      expect(choiceButtons().map(button => button.getAttribute('aria-label'))).toEqual(game.colorNames.map(toLabel));
      choiceButtons().forEach(button => {
        expect(button.textContent?.trim()).toBe('');
        expect(button.hasAttribute('title')).toBe(false);
      });
    });

    it('should tell which test is running', () => {
      expect(element().textContent).toContain('Click the icons in the order of appearance.');

      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      expect(element().textContent).toContain('Click the colors in the order of appearance.');
    });

    it('should record a guess when an icon button is clicked', () => {
      choiceButtons()[0].click();

      expect(game.guessedIcons()).toEqual([game.iconNames[0]]);
    });

    it('should offer every color after all icons were guessed', () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      expect(choiceButtons().length).toBe(game.colorNames.length);
      choiceButtons().forEach((button, idx) => expect(button.classList).toContain(game.colorNames[idx]));
    });

    it('should record a guess when a color button is clicked', () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      fixture.detectChanges();

      choiceButtons()[0].click();

      expect(game.guessedColors()).toEqual([game.colorNames[0]]);
    });
  });

  describe('guess input', () => {
    const iconButton = (icon: string): HTMLButtonElement | undefined =>
      choiceButtons().find(button => iconName(button) === icon);
    const undoButton = (): HTMLButtonElement | null => element().querySelector<HTMLButtonElement>('button.undo-guess');
    const progressText = (): string | undefined => element().querySelector('.guess-count')?.textContent?.trim();

    beforeEach(async () => {
      finishTeaching();
      await fixture.whenStable();
    });

    it('should show the progress and disable undo before the first guess', () => {
      expect(progressText()).toBe(`0 of ${game.rounds} selected`);
      expect(undoButton()?.disabled).toBe(true);
      expect(choiceButtons().every(button => !button.disabled)).toBe(true);
    });

    it('should disable a guessed icon and show it in the progress', async () => {
      const [first] = game.usedIcons();
      iconButton(first)?.click();
      await fixture.whenStable();

      expect(iconButton(first)?.disabled).toBe(true);
      expect(progressText()).toBe(`1 of ${game.rounds} selected`);
      expect(element().querySelectorAll('.guess-step').length).toBe(1);
      expect(element().querySelector('.guess-step')?.getAttribute('aria-label')).toBe(toLabel(first));
      expect(undoButton()?.disabled).toBe(false);
    });

    it('should re-enable an icon after undo', async () => {
      const [first] = game.usedIcons();
      iconButton(first)?.click();
      await fixture.whenStable();

      undoButton()?.click();
      await fixture.whenStable();

      expect(iconButton(first)?.disabled).toBe(false);
      expect(progressText()).toBe(`0 of ${game.rounds} selected`);
      expect(element().querySelectorAll('.guess-step').length).toBe(0);
    });

    it('should disable a guessed color and color the preview', async () => {
      [...game.usedIcons()].forEach(icon => game.guessIcon(icon));
      await fixture.whenStable();

      const [firstColor] = game.usedColors();
      const colorButton = (): HTMLButtonElement | undefined =>
        choiceButtons().find(button => button.classList.contains(firstColor));
      colorButton()?.click();
      await fixture.whenStable();

      expect(colorButton()?.disabled).toBe(true);
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

      const solutionItems = Array.from(element().querySelectorAll('ol.solution > li > [role="img"]'));
      expect(solutionItems.length).toBe(game.rounds);
      solutionItems.forEach((item, idx) => {
        expect(item.classList).toContain(game.usedColors()[idx]);
        expect(iconName(item)).toBe(game.usedIcons()[idx]);
      });
    });

    it('should describe the solution for screen readers', () => {
      playGame(true);

      const labels = Array.from(element().querySelectorAll('ol.solution > li > [role="img"]')).map(item =>
        item.getAttribute('aria-label'),
      );
      expect(labels).toEqual(game.solution().map(step => `${toLabel(step.icon)} on ${toLabel(step.color)}`));
      // The only text is the icon ligatures.
      expect(element().querySelector('ol.solution')?.textContent?.replace(/\s+/g, '')).toBe(game.usedIcons().join(''));
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
      const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      component.restart();
      finishTeaching();

      expect(navigateSpy).toHaveBeenCalledExactlyOnceWith(['home']);
      expect(game.roundsCount()).toBe(1);
    });

    it('should navigate home when "Restart" is clicked', () => {
      const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      playGame(true);

      Array.from(element().querySelectorAll('button'))
        .find(button => button.textContent?.trim() === 'Restart')
        ?.click();

      expect(navigateSpy).toHaveBeenCalledExactlyOnceWith(['home']);
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
