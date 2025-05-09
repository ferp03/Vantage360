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
  @ViewChild('skillsForm') skillsForm!: ElementRef;

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
      console.error('Faltan campos requeridos');
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
          console.log('Habilidad creada y asociada al empleado', res.data);
          form.resetForm();
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
  resetForm(): void {
    this.skillName = '';
    this.skillCategory = '';
    this.skillLevel = '';
    this.skillDescription = '';
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
      this.location.back();
    }
  }
}