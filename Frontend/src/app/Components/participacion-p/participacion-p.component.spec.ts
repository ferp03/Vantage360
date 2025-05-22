import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipacionPComponent } from './participacion-p.component';

describe('ParticipacionPComponent', () => {
  let component: ParticipacionPComponent;
  let fixture: ComponentFixture<ParticipacionPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipacionPComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticipacionPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
