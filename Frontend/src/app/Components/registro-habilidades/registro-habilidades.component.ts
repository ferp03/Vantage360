import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { AuthService } from 'src/app/auth/auth.service';

interface Habilidad {
  habilidad_id: number,
  nombre: string,
  categoria: string
}

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

  habilidades: Habilidad[] = [];
  selectedHabilidad: Habilidad | 'nueva' | null = null;


  constructor(
    private router: Router,
    private route: ActivatedRoute,  
    private apiService: ApiService,
    private location: Location,
    private authService: AuthService
  ) {}

  userSkills: any[] = [];

  ngOnInit(): void {
  this.empleadoId = this.authService.userId;
  this.getHabilidades();
  
  if (this.empleadoId) {
    this.apiService.getEmpleadoHabilidades(this.empleadoId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.userSkills = res.data;
          this.userSkills.sort((a: any, b: any) => {
            if (a.nombre && b.nombre) {
              return a.nombre.localeCompare(b.nombre);
            }
            return 0;
          });
        }
      },
      error: (err) => {
        console.error('Error al obtener habilidades del usuario:', err);
      }
    });
  }
}

  getHabilidades() {
    this.apiService.getHabilidades().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.habilidades = res.data;
        } else {
          console.error('Error al cargar leads:', res.error);
        }
      },
      error: (err: any) => {
        console.error('Error al obtener leads:', err);
      }
    });
  };


  onHabilidadSeleccionada(): void {
    if (typeof this.selectedHabilidad === 'object' && this.selectedHabilidad !== null) {
      this.skillName = this.selectedHabilidad.nombre;
      this.skillCategory = this.selectedHabilidad.categoria;
    } else if (this.selectedHabilidad === 'nueva') {
      this.skillName = '';
      this.skillCategory = '';
    } else {
      this.skillName = '';
      this.skillCategory = '';
    }
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
  
  const skillExists = this.userSkills.some(skill => 
    skill.nombre && skill.nombre.toLowerCase() === this.skillName.toLowerCase()
  );
  
  if (skillExists) {
    this.showToast('Ya tienes registrada esta habilidad en tu perfil.', true);
    return;
  }

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
        this.userSkills.push({
          nombre: this.skillName,
          categoria: this.skillCategory,
          nivel: this.skillLevel
        });
        form.resetForm();
        this.showToast('Habilidad registrada con éxito');
      } else {
        this.showToast(res.error || 'Error al registrar la habilidad.', true);
      }
    },
    error: (err) => {
      if (err.status === 409) {
        this.showToast('Ya tienes registrada esta habilidad en tu perfil.', true);
      } else if (err.error && err.error.message) {
        this.showToast(err.error.message, true);
      } else {
        this.showToast('Ocurrió un error al registrar la habilidad.', true);
        console.error('Error en la petición:', err);
      }
    }
  });
}

  showToast(message: string, isError: boolean = false): void {
    const toast = this.toast.nativeElement;
    toast.textContent = message;

    toast.classList.remove('success-toast', 'error-toast');

    if (isError) {
      toast.classList.add('error-toast');
    } else {
      toast.classList.add('success-toast');
    }

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