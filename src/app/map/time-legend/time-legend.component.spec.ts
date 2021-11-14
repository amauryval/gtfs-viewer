import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLegendComponent } from './time-legend.component';

describe('TimeLegendComponent', () => {
  let component: TimeLegendComponent;
  let fixture: ComponentFixture<TimeLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeLegendComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
