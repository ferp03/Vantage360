import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menucurycert',
  templateUrl: './menucurycert.component.html',
  styleUrls: ['./menucurycert.component.css']
})
export class MenucurycertComponent {

  constructor(private router: Router) {}

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

}
