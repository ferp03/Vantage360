import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

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

  empleadoId = '2a159dda-93e7-436c-a1a4-2cb42f493665'; 

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.obtenerCursos();
  }

  obtenerCursos() {
    this.api.obtenerCursosEmpleado(this.empleadoId).subscribe(res => {
      this.cursos = res.data || [];
      this.ordenarCursosPorFecha();
      this.actualizarPaginacion();
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
      next: () => {
        this.obtenerCursos();
        this.cerrarFormulario();
      },
      error: (err) => {
        console.error('Error al guardar curso:', err);
      }
    });
  }
}
