import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';

interface Comentarios {
  empleado_id: number;
  descripcion: string;
  fecha_generacion: string;
  autor_id: string;
  autor_nombre: string;
  proyecto_id: number;
  proyecto_nombre: string;
}

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

  comentarioSeleccionado: any = null;
  mostrarModalComentarios: boolean = false;
  comentariosPasados: Comentarios[] = [];
  comentarioTexto: string = '';
  fecha_generacion: string = '';
  autor_id: number = 0;
  proyecto_id: number = 0;
  autor_nombre: string = '';
  proyecto_nombre: string = '';

  
  constructor(
    private apiService: ApiService,
    private router: Router
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
      // Filtro por disponibilidad
      if (this.filtros.soloDisponibles && !emp.disponible) {
        return false;
      }

      // Filtro por nivel
      if (this.filtros.nivel && emp.nivel !== Number(this.filtros.nivel)) {
        return false;
      }

      // Filtro por rol
      if (this.filtros.rol && !emp.roles.some((r: any) => r.nombre === this.filtros.rol)) {
        return false;
      }

      // Filtro por capability
      if (this.filtros.capability && (emp.capability || 'Ninguna') !== this.filtros.capability) {
        return false;
      }

      // Filtro por habilidad
      if (this.filtros.habilidad && !emp.habilidades.some((h: any) => h.nombre === this.filtros.habilidad)) {
        return false;
      }

      // Filtro por texto de búsqueda (usuario, correo o nombre completo)
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

    // Reiniciar paginación
    this.currentPage = 1;
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
  this.empleadoSeleccionado = empleado;
  this.comentarioTexto = '';
  this.mostrarModalComentarios = true;

  // Llama al API para obtener los comentarios del empleado
  this.apiService.obtenerComentarioEmpleado(empleado.empleado_id).subscribe({
    next: (comentarios: any[]) => {
      // Mapear los comentarios para incluir nombres
      this.comentariosPasados = comentarios.map(comentario => ({
        ...comentario,
        autor_nombre: comentario.autor_nombre || 'Desconocido',
        proyecto_nombre: comentario.proyecto_nombre || 'Sin proyecto'
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


  agregarComentarios(): void {
  if (!this.empleadoSeleccionado || !this.comentarioTexto.trim() || !this.autor_id || !this.proyecto_id) {
    this.error = 'Todos los campos son obligatorios';
    return;
  }

    const datos = {
      autor_id: this.autor_id, // UUID del autor del comentario
      proyecto_id: this.proyecto_id, // ID del proyecto
      descripcion: this.comentarioTexto.trim() // contenido del comentario
    };

    const empleadoComentadoId = this.empleadoSeleccionado.empleado_id;

    this.apiService.agregarComentario(empleadoComentadoId, datos).subscribe({
      next: (res: any) => {
        this.mostrarModalComentarios = false;
        this.empleadoSeleccionado = null;
        this.comentarioTexto = '';
        this.error = '';
      },
      error: (err) => {
        console.error('Error al guardar comentario:', err);
        this.error = err.error?.error || 'Error al conectar con el servidor';
      }
    });
  }


  cancelarComentarios(): void {
    this.mostrarModalComentarios = false;
    this.empleadoSeleccionado = null;
    this.comentarioTexto = '';
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

}
