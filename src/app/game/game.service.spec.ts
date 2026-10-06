import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector, createEnvironmentInjector, provideZonelessChangeDetection } from '@angular/core';
import { provideStore, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';

import { reducer, Result } from '../store/result.reducer';
import { ColorName, GameState, IconName } from './game.model';
import { GameService } from './game.service';

describe('GameService', () => {
  let injector: EnvironmentInjector;
  let game: GameService;
  let store: Store<{ result: Result }>;

  // Lets the teaching interval run until every round has been shown.
  const finishTeaching = (): void => {
    vi.advanceTimersByTime(game.displayInterval * game.rounds);
  };

  const guessAllIcons = (icons = game.usedIcons()): void => {
    [...icons].forEach(icon => game.guessIcon(icon));
  };

  const guessAllColors = (colors = game.usedColors()): void => {
    [...colors].forEach(color => game.guessColor(color));
  };

  const result = (): Promise<Result> => firstValueFrom(store.select(state => state.result));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideStore({ result: reducer })],
    });

    // A child injector mirrors the per-component lifetime and can be destroyed in tests.
    injector = createEnvironmentInjector([GameService], TestBed.inject(EnvironmentInjector));
    game = injector.get(GameService);
    store = TestBed.inject(Store);
  });

  afterEach(() => {
    vi.useRealTimers();
    injector.destroy();
  });

  it('should be idle before the game starts', () => {
    expect(game.state()).toBe(GameState.Start);
    expect(game.roundsCount()).toBe(0);
    expect(game.displayIcon()).toBeUndefined();
  });

  describe('teaching phase', () => {
    beforeEach(() => game.start());

    it('should show the first round immediately', () => {
      expect(game.state()).toBe(GameState.Teach);
      expect(game.roundsCount()).toBe(1);
      expect(game.usedIcons().length).toBe(1);
      expect(game.usedColors().length).toBe(1);
    });

    it('should show the next round after each display interval', () => {
      vi.advanceTimersByTime(game.displayInterval);

      expect(game.roundsCount()).toBe(2);
      expect(game.state()).toBe(GameState.Teach);
    });

    it('should derive the displayed icon and color from the latest round', () => {
      vi.advanceTimersByTime(game.displayInterval);

      expect(game.displayIcon()).toBe(game.usedIcons()[1]);
      expect(game.displayColor()).toBe(game.usedColors()[1]);
    });

    it('should switch to the icon test after all rounds were shown', () => {
      finishTeaching();

      expect(game.state()).toBe(GameState.TestIcons);
      expect(game.roundsCount()).toBe(game.rounds);
      expect(game.usedColors().length).toBe(game.rounds);
    });

    it('should stop adding rounds after the teaching phase', () => {
      finishTeaching();
      vi.advanceTimersByTime(game.displayInterval * 5);

      expect(game.roundsCount()).toBe(game.rounds);
    });

    it('should never repeat an icon or a color within one game', () => {
      finishTeaching();

      expect(new Set(game.usedIcons()).size).toBe(game.rounds);
      expect(new Set(game.usedColors()).size).toBe(game.rounds);
    });

    it('should remove used icons and colors from the available pool', () => {
      finishTeaching();

      game.usedIcons().forEach(icon => expect(game.availableIcons()).not.toContain(icon));
      game.usedColors().forEach(color => expect(game.availableColors()).not.toContain(color));
      expect(game.availableIcons().length).toBe(game.iconNames.length - game.rounds);
      expect(game.availableColors().length).toBe(game.colorNames.length - game.rounds);
    });

    it('should pair icons and colors in the solution', () => {
      finishTeaching();

      expect(game.solution()).toEqual(
        game.usedIcons().map((icon, index) => ({ icon, color: game.usedColors()[index] })),
      );
    });
  });

  describe('random selection', () => {
    it('should pick from the remaining icons and colors', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      game.start();
      finishTeaching();

      expect(game.usedIcons()).toEqual([IconName.Truck, IconName.Beer, IconName.Bed]);
      expect(game.usedColors()).toEqual([ColorName.Red, ColorName.Yellow, ColorName.Green]);
    });

    it('should be able to pick the last element of the pool', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999);

      game.start();

      expect(game.usedIcons()).toEqual([IconName.Plane]);
      expect(game.usedColors()).toEqual([ColorName.Teal]);
    });
  });

  describe('testing phase', () => {
    beforeEach(() => {
      game.start();
      finishTeaching();
    });

    it('should stay in the icon test until all icons were guessed', () => {
      game.guessIcon(game.usedIcons()[0]);

      expect(game.state()).toBe(GameState.TestIcons);
      expect(game.guessedIcons()).toEqual([game.usedIcons()[0]]);
    });

    it('should switch to the color test after all icons were guessed', () => {
      guessAllIcons();

      expect(game.state()).toBe(GameState.TestColors);
    });

    it('should report success and count a hit for the correct sequence', async () => {
      guessAllIcons();
      guessAllColors();

      expect(game.state()).toBe(GameState.Correct);
      expect(await result()).toEqual({ hitCount: 1, missCount: 0 });
    });

    it('should report failure and count a miss when the icon order is wrong', async () => {
      guessAllIcons([...game.usedIcons()].reverse());
      guessAllColors();

      expect(game.state()).toBe(GameState.False);
      expect(await result()).toEqual({ hitCount: 0, missCount: 1 });
    });

    it('should report failure when the color order is wrong', () => {
      guessAllIcons();
      guessAllColors([...game.usedColors()].reverse());

      expect(game.state()).toBe(GameState.False);
    });

    it('should not evaluate before all colors were guessed', async () => {
      guessAllIcons();
      game.guessColor(game.usedColors()[0]);

      expect(game.state()).toBe(GameState.TestColors);
      expect(await result()).toEqual({ hitCount: 0, missCount: 0 });
    });
  });

  describe('guess rules', () => {
    beforeEach(() => {
      game.start();
      finishTeaching();
    });

    it('should ignore an icon that was already guessed', () => {
      const [first, second] = game.usedIcons();
      game.guessIcon(first);
      game.guessIcon(first);
      game.guessIcon(second);

      expect(game.guessedIcons()).toEqual([first, second]);
    });

    it('should ignore a color that was already guessed', () => {
      guessAllIcons();
      const [first, second] = game.usedColors();
      game.guessColor(first);
      game.guessColor(first);
      game.guessColor(second);

      expect(game.guessedColors()).toEqual([first, second]);
    });

    it('should ignore color guesses during the icon test', () => {
      game.guessColor(game.usedColors()[0]);

      expect(game.guessedColors()).toEqual([]);
    });

    it('should ignore icon guesses during the color test', () => {
      guessAllIcons();
      game.guessIcon(game.availableIcons()[0]);

      expect(game.guessedIcons()).toEqual(game.usedIcons());
    });

    it('should ignore guesses after the game ended', async () => {
      guessAllIcons();
      guessAllColors();
      game.guessColor(game.availableColors()[0]);

      expect(game.guessedColors()).toEqual(game.usedColors());
      expect(await result()).toEqual({ hitCount: 1, missCount: 0 });
    });
  });

  it('should ignore guesses during the teaching phase', () => {
    game.start();
    game.guessIcon(game.usedIcons()[0]);

    expect(game.guessedIcons()).toEqual([]);
  });

  describe('progress', () => {
    beforeEach(() => {
      game.start();
      finishTeaching();
    });

    it('should count icon guesses during the icon test', () => {
      expect(game.guessCount()).toBe(0);
      game.guessIcon(game.usedIcons()[0]);

      expect(game.guessCount()).toBe(1);
    });

    it('should count color guesses during the color test', () => {
      guessAllIcons();
      expect(game.guessCount()).toBe(0);

      game.guessColor(game.usedColors()[0]);

      expect(game.guessCount()).toBe(1);
    });

    it('should preview the guessed icons and fill in the guessed colors', () => {
      guessAllIcons();
      game.guessColor(game.usedColors()[0]);

      expect(game.guessPreview()).toEqual(
        game.usedIcons().map((icon, index) => ({ icon, color: index === 0 ? game.usedColors()[0] : undefined })),
      );
    });
  });

  describe('undo', () => {
    it('should not be possible during the teaching phase', () => {
      game.start();

      expect(game.canUndo()).toBe(false);
    });

    describe('during the tests', () => {
      beforeEach(() => {
        game.start();
        finishTeaching();
      });

      it('should not be possible before the first guess', () => {
        expect(game.canUndo()).toBe(false);

        game.undoGuess();

        expect(game.state()).toBe(GameState.TestIcons);
      });

      it('should take back the last icon', () => {
        const [first, second] = game.usedIcons();
        game.guessIcon(first);
        game.guessIcon(second);
        expect(game.canUndo()).toBe(true);

        game.undoGuess();

        expect(game.guessedIcons()).toEqual([first]);
        expect(game.state()).toBe(GameState.TestIcons);
      });

      it('should allow guessing an icon again after taking it back', () => {
        const [first] = game.usedIcons();
        game.guessIcon(first);
        game.undoGuess();
        game.guessIcon(first);

        expect(game.guessedIcons()).toEqual([first]);
      });

      it('should take back the last color', () => {
        guessAllIcons();
        const [first, second] = game.usedColors();
        game.guessColor(first);
        game.guessColor(second);

        game.undoGuess();

        expect(game.guessedColors()).toEqual([first]);
        expect(game.state()).toBe(GameState.TestColors);
      });

      it('should return to the icon test when no color was guessed yet', () => {
        guessAllIcons();

        game.undoGuess();

        expect(game.state()).toBe(GameState.TestIcons);
        expect(game.guessedIcons()).toEqual(game.usedIcons().slice(0, -1));
      });

      it('should not be possible after the game ended', () => {
        guessAllIcons();
        guessAllColors();
        expect(game.canUndo()).toBe(false);

        game.undoGuess();

        expect(game.state()).toBe(GameState.Correct);
        expect(game.guessedColors()).toEqual(game.usedColors());
      });
    });
  });

  describe('stopping', () => {
    it('should stop the teaching timer on stop()', () => {
      game.start();
      game.stop();
      finishTeaching();

      expect(game.roundsCount()).toBe(1);
    });

    it('should stop the teaching timer when its injector is destroyed', () => {
      const ownInjector = createEnvironmentInjector([GameService], TestBed.inject(EnvironmentInjector));
      const ownGame = ownInjector.get(GameService);
      ownGame.start();

      ownInjector.destroy();

      expect(() => finishTeaching()).not.toThrow();
      expect(ownGame.roundsCount()).toBe(1);
    });
  });
});
