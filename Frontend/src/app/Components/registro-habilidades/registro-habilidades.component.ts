import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-registro-habilidades',
  templateUrl: './registro-habilidades.component.html',
  styleUrls: ['./registro-habilidades.component.css']
})
export class RegistroHabilidadesComponent implements OnInit {
  @ViewChild('toast') toast!: ElementRef;
  @ViewChild('skillsForm') skillsForm!: ElementRef;

  empleadoId!: string; 

  constructor(
    private router: Router,
    private route: ActivatedRoute,  
    private apiService: ApiService  
  ) {}

  ngOnInit(): void {
    this.empleadoId = this.route.snapshot.paramMap.get('id') || '';
  }

  onSubmit(): void {
    const form = this.skillsForm.nativeElement;
    const skillName = form.querySelector('#skillName').value;
    const skillCategory = form.querySelector('#skillCategory').value;
    const skillLevel = form.querySelector('#skillLevel').value;
    const skillDescription = form.querySelector('#skillDescription').value;

    if (!skillName || !skillCategory || !skillLevel) {
      console.error('Faltan campos requeridos');
      return;
    }

    this.apiService.agregarHabilidad(
      this.empleadoId,
      {
        nombre: skillName,
        categoria: skillCategory,
        nivel: skillLevel,
        descripcion: skillDescription
      }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          console.log('Habilidad creada y asociada al empleado', res.data);
          form.reset(); 
          this.showToast();
        } else {
          console.log('Error al agregar la habilidad:', res.error);
        }
      },
      error: (err) => {
        console.error('Error en la petición:', err);
      }
    });
  }

  showToast(): void {
    const toast = this.toast.nativeElement;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 1300);
  }

  volver(): void {
    if (this.empleadoId) {
      this.router.navigate(['/empleado-detalles', this.empleadoId]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}