import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-registro-habilidades',
  templateUrl: './registro-habilidades.component.html',
  styleUrls: ['./registro-habilidades.component.css']
})
export class RegistroHabilidadesComponent implements OnInit {
  @ViewChild('toast') toast!: ElementRef;

  private empleadoId: string | null = null;

  skillName: string = '';
  skillCategory: string = '';
  skillLevel: string = '';
  skillDescription: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,  
    private apiService: ApiService,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.empleadoId = this.authService.userId;
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    if (!this.skillName || !this.skillCategory || !this.skillLevel) {
      this.showToast('Todos los campos requeridos deben estar llenos.', true);
      return;
    }

    if (!this.empleadoId) return;

    this.apiService.agregarHabilidad(
      this.empleadoId,
      {
        nombre: this.skillName,
        categoria: this.skillCategory,
        nivel: this.skillLevel,
        descripcion: this.skillDescription
      }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          form.resetForm();
          this.showToast('Habilidad registrada');
        } else {
          this.showToast(res.error || 'Habilidad ya existente.', true);
        }
      },
      error: (err) => {
        if (err.status === 409) {
          this.showToast('Habilidad ya existente', true);
        } else {
          this.showToast('Ocurrió un error inesperado.', true);
          console.error('Error en la petición:', err);
        }
      }
    });
  }

  showToast(message: string, isError: boolean = false): void {
    const toast = this.toast.nativeElement;
    toast.textContent = message;

    // Limpiar clases previas
    toast.classList.remove('success-toast', 'error-toast');

    // Agregar clase correspondiente
    if (isError) {
      toast.classList.add('error-toast');
    } else {
      toast.classList.add('success-toast');
    }

    // Mostrar el toast
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  volver(): void {
    if (this.empleadoId) {
      this.router.navigate(['/empleado-detalles', this.empleadoId]);
    } else {
      this.location.back();
    }
  }
}