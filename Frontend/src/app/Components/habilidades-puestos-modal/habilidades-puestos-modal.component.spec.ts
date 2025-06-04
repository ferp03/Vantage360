import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabilidadesPuestosModalComponent } from './habilidades-puestos-modal.component';

describe('HabilidadesPuestosModalComponent', () => {
  let component: HabilidadesPuestosModalComponent;
  let fixture: ComponentFixture<HabilidadesPuestosModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HabilidadesPuestosModalComponent]
    });
    fixture = TestBed.createComponent(HabilidadesPuestosModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
