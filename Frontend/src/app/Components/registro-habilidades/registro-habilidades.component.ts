// registro-habilidades.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-habilidades',
  templateUrl: './registro-habilidades.component.html',
  styleUrls: ['./registro-habilidades.component.css']
})
export class RegistroHabilidadesComponent {
  @ViewChild('toast') toast!: ElementRef;
  @ViewChild('skillsForm') skillsForm!: ElementRef; // Referencia al formulario

  constructor(private router: Router) {}

  onSubmit(): void {
    // 1. Obtener los valores del formulario directamente desde los campos
    const form = this.skillsForm.nativeElement;
    const skillName = form.querySelector('#skillName').value;
    const skillCategory = form.querySelector('#skillCategory').value;
    const skillLevel = form.querySelector('#skillLevel').value;
    const skillDescription = form.querySelector('#skillDescription').value;

    // 2. Mostrar en consola (formato claro)
    console.log('=== DATOS DE LA HABILIDAD REGISTRADA ===');
    console.log('Nombre:', skillName);
    console.log('Categoría:', skillCategory);
    console.log('Nivel:', skillLevel);
    console.log('Descripción:', skillDescription);
    console.log('========================================');

    // 3. Mostrar notificación (opcional)
    this.showToast();
    
    setTimeout(() => {
      /* this.router.navigate(['/empleado-detalles']); */
    }, 1500);
  }

  showToast(): void {
    const toast = this.toast.nativeElement;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 1300);
  }

  /* goBack(): void {
    this.router.navigate(['/empleado-detalles']);
  } */
}