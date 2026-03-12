import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { TeachingPhaseComponent } from './teaching-phase.component';
import { reducer } from '../store/result.reducer';

describe('TeachingPhaseComponent', () => {
  let component: TeachingPhaseComponent;
  let fixture: ComponentFixture<TeachingPhaseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TeachingPhaseComponent],
      providers: [provideRouter([]), provideStore({ result: reducer })],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TeachingPhaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
