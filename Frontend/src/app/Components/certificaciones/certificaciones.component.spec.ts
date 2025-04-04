import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificacionesComponent } from './certificaciones.component';

describe('CertificacionesComponent', () => {
  let component: CertificacionesComponent;
  let fixture: ComponentFixture<CertificacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CertificacionesComponent]
    });
    fixture = TestBed.createComponent(CertificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
