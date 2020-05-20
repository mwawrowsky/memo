import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TeachingPhaseComponent } from './teaching-phase.component';

describe('TeachingPhaseComponent', () => {
  let component: TeachingPhaseComponent;
  let fixture: ComponentFixture<TeachingPhaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TeachingPhaseComponent ]
    })
    .compileComponents();
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
