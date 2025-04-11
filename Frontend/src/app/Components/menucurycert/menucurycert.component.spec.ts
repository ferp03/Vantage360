import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenucurycertComponent } from './menucurycert.component';

describe('MenucurycertComponent', () => {
  let component: MenucurycertComponent;
  let fixture: ComponentFixture<MenucurycertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MenucurycertComponent]
    });
    fixture = TestBed.createComponent(MenucurycertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
