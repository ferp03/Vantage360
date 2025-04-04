import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubirCertificadoComponent } from './subir-certificado.component';

describe('SubirCertificadoComponent', () => {
  let component: SubirCertificadoComponent;
  let fixture: ComponentFixture<SubirCertificadoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubirCertificadoComponent]
    });
    fixture = TestBed.createComponent(SubirCertificadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
