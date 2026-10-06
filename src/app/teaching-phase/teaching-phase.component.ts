import { Component, OnInit, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatRipple } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { GameState, toLabel } from '../game/game.model';
import { GameService } from '../game/game.service';
import { reset } from '../store/result.actions';
import { Result } from '../store/result.reducer';

@Component({
  selector: 'app-teaching-phase',
  templateUrl: './teaching-phase.component.html',
  styleUrls: ['./teaching-phase.component.css'],
  standalone: true,
  imports: [MatButton, MatIcon, MatRipple],
  providers: [GameService],
})
export class TeachingPhaseComponent implements OnInit {
  readonly game = inject(GameService);

  protected readonly GameState = GameState;
  protected readonly label = toLabel;

  private readonly router = inject(Router);
  private readonly store = inject<Store<{ result: Result }>>(Store);

  readonly hitCount = this.store.selectSignal(state => state.result.hitCount);
  readonly missCount = this.store.selectSignal(state => state.result.missCount);

  ngOnInit(): void {
    this.game.start();
  }

  restart(): void {
    this.game.stop();
    void this.router.navigate(['home']);
  }

  resetStatistics(): void {
    this.store.dispatch(reset());
  }
}
