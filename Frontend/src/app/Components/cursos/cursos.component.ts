import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-cursos',
  templateUrl: './cursos.component.html',
  styleUrls: ['./cursos.component.css']
})
export class CursosComponent implements OnInit {
  cursos: any[] = [];
  cursosPaginados: any[] = [];
  cursosPorPagina = 4;
  paginaActual = 1;
  totalPaginas = 1;
  
  // Error handling
  error: string | null = null;
  loading: boolean = false;

  mostrarFormulario = false;

  nuevoCurso = {
    nombre: '',
    fecha_emision: '',
    fecha_vencimiento: ''
  };

  archivoSeleccionado: File | null = null;
  formErrores = {
    nombre: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    archivo: ''
  };

  empleadoId: string = '';

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get user ID from AuthService
    const userId = this.authService.userId;
    
    console.log('AuthService userId:', userId);
    
    if (userId) {
      this.empleadoId = userId;
      console.log('Using userId from AuthService:', this.empleadoId);
      this.obtenerCursos();
    } else {
      this.error = 'No se pudo obtener el ID del usuario. Por favor, vuelve a iniciar sesión.';
      console.error('No user ID available from auth service');
    }
  }

  obtenerCursos() {
    console.log('Obteniendo cursos para empleadoId:', this.empleadoId);
    this.loading = true;
    this.error = null;
    
    this.api.obtenerCursosEmpleado(this.empleadoId).subscribe({
      next: (res) => {
        console.log('API response:', res);
        this.loading = false;
        
        if (res && res.data) {
          this.cursos = res.data;
          console.log('Cursos obtenidos:', this.cursos.length);
          
          if (this.cursos.length === 0) {
            console.log('No se encontraron cursos para este usuario');
          }
          
          this.ordenarCursosPorFecha();
          this.actualizarPaginacion();
        } else {
          console.error('Formato de respuesta inválido:', res);
          this.error = 'Formato de respuesta inválido';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        console.error('Error al obtener cursos:', err);
        
        if (err.status === 401) {
          this.error = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
        } else if (err.status === 403) {
          this.error = 'No tienes permiso para acceder a estos cursos.';
        } else if (err.status === 404) {
          this.error = 'No se encontraron cursos para este usuario.';
        } else {
          this.error = `Error al obtener cursos: ${err.message || 'Desconocido'}`;
        }
      }
    });
  }

  ordenarCursosPorFecha() {
    this.cursos.sort((a, b) =>
      new Date(a.fecha_emision).getTime() - new Date(b.fecha_emision).getTime()
    );
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.cursos.length / this.cursosPorPagina);
    const inicio = (this.paginaActual - 1) * this.cursosPorPagina;
    const fin = inicio + this.cursosPorPagina;
    this.cursosPaginados = this.cursos.slice(inicio, fin);
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  abrirFormulario() {
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.archivoSeleccionado = null;
    this.nuevoCurso = {
      nombre: '',
      fecha_emision: '',
      fecha_vencimiento: ''
    };
    this.formErrores = {
      nombre: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      archivo: ''
    };
  }

  onArchivoSeleccionado(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.archivoSeleccionado = archivo;
    }
  }

  guardarCurso() {
    this.formErrores = {
      nombre: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      archivo: ''
    };

    let valido = true;

    if (!this.nuevoCurso.nombre.trim()) {
      this.formErrores.nombre = 'El nombre es obligatorio.';
      valido = false;
    }

    if (!this.nuevoCurso.fecha_emision) {
      this.formErrores.fecha_emision = 'La fecha de emisión es obligatoria.';
      valido = false;
    }

    if (!this.nuevoCurso.fecha_vencimiento) {
      this.formErrores.fecha_vencimiento = 'La fecha de vencimiento es obligatoria.';
      valido = false;
    }

    if (!this.archivoSeleccionado) {
      this.formErrores.archivo = 'Debes adjuntar un archivo.';
      valido = false;
    }

    if (!valido) return;

    const formData = new FormData();
    formData.append('nombre', this.nuevoCurso.nombre);
    formData.append('fecha_emision', this.nuevoCurso.fecha_emision);
    formData.append('fecha_vencimiento', this.nuevoCurso.fecha_vencimiento);
    formData.append('archivo', this.archivoSeleccionado!);

    this.api.crearCurso(this.empleadoId, formData).subscribe({
      next: (res) => {
        console.log('Curso guardado:', res);
        this.obtenerCursos();
        this.cerrarFormulario();
      },
      error: (err) => {
        console.error('Error al guardar curso:', err);
        
        if (err.status === 401) {
          this.error = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
        } else {
          this.error = `Error al guardar curso: ${err.error?.message || err.message || 'Desconocido'}`;
        }
      }
    });
  }
}