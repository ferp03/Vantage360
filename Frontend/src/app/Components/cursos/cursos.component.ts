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
  loading: boolean = false;
  guardandoCurso: boolean = false;
  mostrarFormulario = false;
  mostrarModalConfirmacion = false;
  eliminandoCurso = false;
  cursoIdAEliminar: string | null = null;

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
    this.guardandoCurso = false;
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
        this.obtenerCursos(); // Recargar la lista de cursos
        this.mostrarModalConfirmacion = false;
        this.cursoIdAEliminar = null;
        this.eliminandoCurso = false;
      },
      error: (err) => {
        this.eliminandoCurso = false;
        this.error = `Error al eliminar curso: ${err.error?.message || err.message || 'Desconocido'}`;
      }
    });
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

    if (this.nuevoCurso.fecha_emision && this.nuevoCurso.fecha_vencimiento) {
      const fechaEmision = new Date(this.nuevoCurso.fecha_emision);
      const fechaVencimiento = new Date(this.nuevoCurso.fecha_vencimiento);

      if (fechaVencimiento < fechaEmision) {
        this.formErrores.fecha_vencimiento = 'La fecha de vencimiento no puede ser anterior a la fecha de emisión.';
        valido = false;
      }
    }

    if (!this.archivoSeleccionado) {
      this.formErrores.archivo = 'Debes adjuntar un archivo.';
      valido = false;
    }

    if (!valido) return;

    this.guardandoCurso = true;

    const formData = new FormData();
    formData.append('nombre', this.nuevoCurso.nombre);
    formData.append('fecha_emision', this.nuevoCurso.fecha_emision);
    formData.append('fecha_vencimiento', this.nuevoCurso.fecha_vencimiento);
    formData.append('archivo', this.archivoSeleccionado!);

    this.api.crearCurso(this.empleadoId, formData).subscribe({
      next: () => {
        this.obtenerCursos();
        this.cerrarFormulario();
      },
      error: (err) => {
        this.guardandoCurso = false;
        this.error = `Error al guardar curso: ${err.error?.message || err.message || 'Desconocido'}`;
      }
    });
  }
}
