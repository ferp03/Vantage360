import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearLeadComponent } from './crear-lead.component';

describe('CrearLeadComponent', () => {
  let component: CrearLeadComponent;
  let fixture: ComponentFixture<CrearLeadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrearLeadComponent]
    });
    fixture = TestBed.createComponent(CrearLeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
