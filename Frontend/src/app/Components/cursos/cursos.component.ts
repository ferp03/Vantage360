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
  cursosPorPagina = 3;
  paginaActual = 1;
  totalPaginas = 1;
  error: string | null = null;
  loading = false;
  guardandoCurso = false;
  mostrarFormulario = false;
  mostrarModalConfirmacion = false;
  eliminandoCurso = false;
  cursoIdAEliminar: string | null = null;
  cursoIdAEditar: string | null = null;

  nuevoCurso = {
    nombre: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    progreso: 0,
    obligatorio: false
  };

  archivoSeleccionado: File | null = null;

  formErrores: any = {
    nombre: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    archivo: '',
    progreso: ''
  };

  empleadoId: string = '';

  constructor(private api: ApiService, private authService: AuthService) {}

  ngOnInit() {
    const userId = this.authService.userId;
    if (userId) {
      this.empleadoId = userId;
      this.obtenerCursos();
    } else {
      this.error = 'No se pudo obtener el ID del usuario. Por favor, vuelve a iniciar sesión.';
    }
  }

  obtenerCursos() {
    this.loading = true;
    this.error = null;

    this.api.obtenerCursosEmpleado(this.empleadoId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.data) {
          this.cursos = res.data;
          this.ordenarCursosPorFecha();
          this.actualizarPaginacion();
        } else {
          this.error = 'Formato de respuesta inválido';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = err.status === 401 ? 'Sesión expirada.'
            : err.status === 403 ? 'No tienes permiso.'
            : err.status === 404 ? 'No se encontraron cursos.'
            : `Error al obtener cursos: ${err.message || 'Desconocido'}`;
      }
    });
  }

  ordenarCursosPorFecha() {
    this.cursos.sort((a, b) => new Date(a.fecha_emision).getTime() - new Date(b.fecha_emision).getTime());
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
    this.guardandoCurso = false;
    this.archivoSeleccionado = null;
    this.cursoIdAEditar = null;
    this.nuevoCurso = {
      nombre: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      progreso: 0,
      obligatorio: false
    };
    this.formErrores = {
      nombre: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      archivo: '',
      progreso: ''
    };
  }

  onArchivoSeleccionado(event: any) {
    const archivo = event.target.files[0];
    if (archivo) this.archivoSeleccionado = archivo;
  }

  confirmarEliminarCurso(cursoId: string) {
    this.cursoIdAEliminar = cursoId;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminar() {
    this.mostrarModalConfirmacion = false;
    this.cursoIdAEliminar = null;
  }

  eliminarCurso() {
    if (!this.cursoIdAEliminar) return;

    this.eliminandoCurso = true;

    this.api.eliminarCurso(this.empleadoId, this.cursoIdAEliminar).subscribe({
      next: () => {
        this.obtenerCursos();
        this.cancelarEliminar();
        this.eliminandoCurso = false;
      },
      error: (err) => {
        this.eliminandoCurso = false;
        this.error = `Error al eliminar curso: ${err.error?.message || err.message || 'Desconocido'}`;
      }
    });
  }

  editarCurso(curso: any) {
    this.nuevoCurso = {
      nombre: curso.nombre,
      fecha_emision: curso.fecha_emision,
      fecha_vencimiento: curso.fecha_vencimiento,
      progreso: curso.progreso || 0,
      obligatorio: curso.obligatorio ?? false
    };
    this.archivoSeleccionado = null;
    this.cursoIdAEditar = curso.curso_id;
    this.mostrarFormulario = true;
  }

  guardarCurso() {
    this.formErrores = {
      nombre: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      archivo: '',
      progreso: ''
    };

    let valido = true;

    if (!this.nuevoCurso.nombre.trim()) {
      this.formErrores.nombre = 'El nombre es obligatorio.';
      valido = false;
    }

    if (
      this.nuevoCurso.fecha_emision &&
      this.nuevoCurso.fecha_vencimiento &&
      new Date(this.nuevoCurso.fecha_vencimiento) < new Date(this.nuevoCurso.fecha_emision)
    ) {
      this.formErrores.fecha_vencimiento = 'La fecha de vencimiento no puede ser anterior.';
      valido = false;
    }

    if (
      this.nuevoCurso.progreso < 0 ||
      this.nuevoCurso.progreso > 100
    ) {
      this.formErrores.progreso = 'Debe estar entre 0 y 100.';
      valido = false;
    }

    if (!valido) return;

    this.guardandoCurso = true;

    const formData = new FormData();
    formData.append('nombre', this.nuevoCurso.nombre);
    formData.append('fecha_emision', this.nuevoCurso.fecha_emision || '');
    formData.append('fecha_vencimiento', this.nuevoCurso.fecha_vencimiento || '');
    formData.append('progreso', this.nuevoCurso.progreso.toString());
    formData.append('obligatorio', this.nuevoCurso.obligatorio ? 'true' : 'false');

    if (this.archivoSeleccionado) {
      formData.append('archivo', this.archivoSeleccionado);
    }

    const request$ = this.cursoIdAEditar
      ? this.api.editarCurso(this.empleadoId, this.cursoIdAEditar, formData)
      : this.api.crearCurso(this.empleadoId, formData);

    request$.subscribe({
      next: () => {
        this.obtenerCursos();
        this.cerrarFormulario();
      },
      error: (err) => {
        this.guardandoCurso = false;
        if (err.status === 409) {
          this.formErrores.nombre = 'Ya existe un curso con ese nombre.';
        } else {
          this.error = `Error al ${this.cursoIdAEditar ? 'actualizar' : 'guardar'} curso: ${err.error?.error || err.message || 'Desconocido'}`;
        }
      }
    });
  }
}
