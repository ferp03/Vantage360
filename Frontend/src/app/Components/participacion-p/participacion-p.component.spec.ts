import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipacionPComponent } from './participacion-p.component';

describe('ParticipacionPComponent', () => {
  let component: ParticipacionPComponent;
  let fixture: ComponentFixture<ParticipacionPComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ParticipacionPComponent]
    });
    fixture = TestBed.createComponent(ParticipacionPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
