import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';

interface Comentarios {
  comentario_id: number;
  fecha_generacion: string;
  autor_id: string;
  empleado_comentado_id: string;
  proyecto_id: number;
  descripcion: string;
  autor_nombre?: string;
  proyecto_nombre?: string;
}
import { ReporteService } from 'src/app/services/reporte.service';

@Component({
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.component.html',
  styleUrls: ['./disponibilidad.component.css']
})
export class DisponibilidadComponent implements OnInit {
  empleados: any[] = [];
  comentarios: any[] = [];
  empleadosFiltrados: any[] = [];

  // Ahora incluimos habilidad en los filtros
  filtros = {
    rol: '',
    habilidad: '',
    capability: '',
    nivel: null,
    soloDisponibles: false
  };

  nivelesUnicos: number[] = [];
  rolesUnicos: string[] = [];
  habilidadesUnicas: string[] = [];
  capabilities: string[] = [];

  searchText: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 6;
  cargando: boolean = true;
  error: string = '';

  // Para el modal de actualización
  empleadoSeleccionado: any = null;
  nuevoEstado: string = '';
  nuevaCargabilidad: number | null = null;
  mostrarModalActualizar: boolean = false;

  hayFiltrosAplicados: boolean = false;

  empleadoSeleccionadoComentarios: any = null; // Nueva variable para el modal de comentarios
  comentarioSeleccionado: any = null;
  mostrarModalComentarios: boolean = false;
  comentariosPasados: Comentarios[] = [];
  comentarioTexto: string = '';
  fecha_generacion: string = '';
  autor_id: number = 0;
  proyecto_id: number = 0;
  autor_nombre: string = '';
  proyecto_nombre: string = '';
  proyectoSeleccionado: any = null;
  proyectosEmpleado: any[] = [];
  mostrarFormularioComentario: boolean = false;
  errorComentario: string = '';
  // comentariosPaginaActual: number = 1;
  // comentariosPorPagina: number = 6;
  // indicesPagina: number[] = [];

  
  constructor(
    private apiService: ApiService,
    private router: Router,
    private authService: AuthService,
    private reporteService: ReporteService,
  ) {}

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    this.cargando = true;
    this.apiService.getEmpleadosDisponibilidad().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.empleados = res.empleados;
          console.log(this.empleados);
          this.empleadosFiltrados = [...this.empleados];

          // Extraer roles, habilidades y capabilities
          this.extraerFiltrosUnicos();
          
          this.cargando = false;
        } else {
          this.error = 'Error al cargar datos';
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al obtener empleados:', err);
        this.error = err.error?.error || 'Error al conectar con el servidor';
        this.cargando = false;
      }
    });
  }

  extraerFiltrosUnicos(): void {
    // Niveles
    const niveles = this.empleados.map(emp => emp.nivel)
    this.nivelesUnicos = [...new Set(niveles)].sort((a, b) => a - b);

    // Roles únicos
    const todosRoles = this.empleados.flatMap(emp =>
      emp.roles.map((r: any) => r.nombre)
    );
    this.rolesUnicos = [...new Set(todosRoles)].sort((a, b) => a.localeCompare(b)); 

    // Habilidades únicas
    const todasHabilidades = this.empleados.flatMap(emp =>
      emp.habilidades.map((h: any) => h.nombre)
    );
    this.habilidadesUnicas = [...new Set(todasHabilidades)].sort((a, b) => a.localeCompare(b)); 

    // Capabilities únicos
    const todasCapabilities = this.empleados.map(emp => emp.capability ? emp.capability : 'Ninguna');
    this.capabilities = [...new Set(todasCapabilities)];
  }

  
  aplicarFiltros(): void {
    this.empleadosFiltrados = this.empleados.filter(emp => {
      if (this.filtros.soloDisponibles && !emp.disponible) {
        return false;
      }

      if (this.filtros.nivel && emp.nivel !== Number(this.filtros.nivel)) {
        return false;
      }

      if (this.filtros.rol && !emp.roles.some((r: any) => r.nombre === this.filtros.rol)) {
        return false;
      }

      if (this.filtros.capability && (emp.capability || 'Ninguna') !== this.filtros.capability) {
        return false;
      }

      if (this.filtros.habilidad && !emp.habilidades.some((h: any) => h.nombre === this.filtros.habilidad)) {
        return false;
      }

      if (this.searchText) {
        const searchLower = this.searchText.toLowerCase();
        const fullName = `${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno}`.toLowerCase();

        return (
          emp.usuario.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower)
        );
      }

      return true;
    });

    this.actualizarEstadoFiltros();
    this.currentPage = 1;
  }

  actualizarEstadoFiltros(): void {
    this.hayFiltrosAplicados = 
      this.filtros.rol !== '' || 
      this.filtros.habilidad !== '' || 
      this.filtros.capability !== '' || 
      this.filtros.nivel !== null || 
      this.filtros.soloDisponibles || 
      this.searchText !== '';
  }

  limpiarFiltros(): void {
    this.filtros = {
      rol: '',
      habilidad: '',
      capability: '',
      nivel: null,
      soloDisponibles: false
    };
    this.searchText = '';
    this.aplicarFiltros();
  }

  verDetallesEmpleado(empleado: any): void {
    // Ajusta la ruta según tu configuración
    this.router.navigate(['/empleado-detalles', empleado.empleado_id]);
  }

  seleccionarEmpleado(empleado: any): void {
    this.empleadoSeleccionado = empleado;
    this.nuevoEstado = empleado.estado_laboral || '';
    this.nuevaCargabilidad = empleado.cargabilidad;
  }

  actualizarDisponibilidad(): void {
    if (!this.empleadoSeleccionado) return;
    
    const datos: any = {};
    if (this.nuevoEstado) datos.estado_laboral = this.nuevoEstado;
    if (this.nuevaCargabilidad !== null) datos.cargabilidad = this.nuevaCargabilidad;
    
    this.apiService.actualizarDisponibilidad(this.empleadoSeleccionado.empleado_id, datos)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            // Actualizar el empleado en la lista local
            const index = this.empleados.findIndex(e => e.empleado_id === this.empleadoSeleccionado.empleado_id);
            if (index !== -1) {
              this.empleados[index] = {
                ...this.empleados[index],
                ...res.empleado
              };
              // Refrescar toda la lista:
              this.cargarEmpleados();
            }
            this.empleadoSeleccionado = null;
          } else {
            this.error = 'Error al actualizar';
          }
        },
        error: (err) => {
          console.error('Error al actualizar disponibilidad:', err);
          this.error = err.error?.error || 'Error al conectar con el servidor';
        }
      });
  }

  cancelarActualizacion(): void {
    this.empleadoSeleccionado = null;
    this.nuevoEstado = '';
    this.nuevaCargabilidad = null;
  }

  seleccionarComentarios(empleado: any): void {
    this.empleadoSeleccionadoComentarios = empleado;  
    this.comentarioTexto = '';
    this.mostrarModalComentarios = true;
    this.proyectosEmpleado = empleado.proyectos || [];
    console.log('Empleado seleccionado:', this.empleadoSeleccionadoComentarios);
    // this.comentariosPaginaActual = 1;
    // Llama al API para obtener los comentarios del empleado
    this.apiService.obtenerComentarioEmpleado(empleado.empleado_id).subscribe({
      next: (comentarios: any[]) => {
        // Mapear los comentarios para incluir nombres
        this.comentariosPasados = comentarios.map(comentario => ({
          ...comentario,
          autor_nombre: comentario.autor_nombre || 'Desconocido',
          autor_id: comentario.autor_id || '',
          proyecto_nombre: comentario.proyecto_nombre || 'Sin proyecto',
          proyecto_id: comentario.proyecto_id || 0
        }));
        this.fecha_generacion = comentarios[0]?.fecha_generacion || '';
        console.log('Comentarios obtenidos:', this.comentariosPasados);
      },
      error: (error) => {
        console.error('Error al obtener comentarios:', error);
        this.comentariosPasados = [];
      }
    });
  }

  mostrarComentarios() {
  this.mostrarFormularioComentario = !this.mostrarFormularioComentario;

}

  agregarComentarios(): void {

    this.errorComentario = '';

    if (!this.proyectoSeleccionado) {
    this.errorComentario = 'Debes seleccionar un proyecto para el comentario';
    return;
  }

  if (!this.comentarioTexto.trim()) {
    this.errorComentario = 'El comentario no puede estar vacío';
    return;
  }
    
    const datos = {
      autor_id: this.authService.userId,
      proyecto_id: this.proyectoSeleccionado.proyecto_id || 0,
      descripcion: this.comentarioTexto.trim(),
      empleado_comentado_id: this.empleadoSeleccionadoComentarios.empleado_id
    };

    console.log('Datos a enviar para comentario:', datos);

    this.apiService.agregarComentario(this.empleadoSeleccionado, datos).subscribe({
      next: (nuevoComentario: Comentarios) => {
        this.comentariosPasados.unshift({
          ...nuevoComentario,
          autor_nombre: this.autor_nombre,
          proyecto_nombre: this.proyectoSeleccionado?.nombre || 'Sin proyecto'
        });
        
        this.comentarioTexto = '';
        this.proyectoSeleccionado = null;
        this.errorComentario = '';
        this.seleccionarComentarios(this.empleadoSeleccionadoComentarios);

      },
      error: (err) => {
        console.error('Error al guardar comentario:', err);
        this.error = err.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  cancelarComentario(): void {
    this.mostrarFormularioComentario = false;
    this.empleadoSeleccionado = null;
    this.comentarioTexto = '';
    this.proyectoSeleccionado = null;
    this.errorComentario = '';
  }

  cancelarComentarios(): void {
    this.mostrarModalComentarios = false;
    this.mostrarFormularioComentario = false;
    this.empleadoSeleccionadoComentarios = null;
    this.comentarioTexto = '';
    this.proyectoSeleccionado = null;
    this.error = '';
  }

  generarReporteCargabilidad(): void {
  if (this.empleadosFiltrados.length === 0) {
    this.error = 'No hay empleados para generar el reporte';
    return;
  }
  
    this.reporteService.generarReporteCargabilidad(this.empleadosFiltrados);
  }

  // Paginación
  get paginatedEmpleados(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.empleadosFiltrados.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    return Math.ceil(this.empleadosFiltrados.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

   // Paginación COMENTARIOS
//   get comentariosPaginados(): Comentarios[] {
//     const inicio = (this.comentariosPaginaActual - 1) * this.comentariosPorPagina;
//     const fin = inicio + this.comentariosPorPagina;
//     return this.comentariosPasados.slice(inicio, fin);
//   }

//   get totalPagesComment(): number {
//   return Math.ceil(this.comentariosPasados.length / this.comentariosPorPagina);
// }


//   siguientePaginaComentarios(): void {
//   const totalPaginas = Math.ceil(this.comentariosPasados.length / this.comentariosPorPagina);
//   if (this.comentariosPaginaActual < totalPaginas) {
//     this.comentariosPaginaActual++;
//   }
// }

// paginaAnteriorComentarios(): void {
//   if (this.comentariosPaginaActual > 1) {
//     this.comentariosPaginaActual--;
//   }
// }


}