import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-habilidades',
  templateUrl: './registro-habilidades.component.html',
  styleUrls: ['./registro-habilidades.component.css']
})
export class RegistroHabilidadesComponent {
  constructor(private router: Router) {}

  /* goBackToProfile(): void {
    this.router.navigate(['/profile']);
  }  */
}