import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.component.html',
  styleUrls: ['./disponibilidad.component.css']
})
export class DisponibilidadComponent implements OnInit {
  empleados: any[] = [];
  empleadosFiltrados: any[] = [];

  filtros = {
    rol: '',
    habilidad: '',
    certificacion: '',
    soloDisponibles: false
  };

  rolesUnicos: string[] = [];
  habilidadesUnicas: string[] = [];
  certificacionesUnicas: string[] = [];

  searchText: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 7;
  cargando: boolean = true;
  error: string = '';

  // Para el modal de actualización
  empleadoSeleccionado: any = null;
  nuevoEstado: string = '';
  nuevaCargabilidad: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
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
          this.empleadosFiltrados = [...this.empleados];

          // Extraer roles y habilidades únicas
          this.extraerFiltrosUnicos();
          
          this.cargando = false;
        } else {
          this.error = 'No se pudieron cargar los empleados';
        }
      },
      error: () => {
        this.error = 'Error al cargar los empleados';
        this.cargando = false;
      }
    });
  }

  extraerFiltrosUnicos(): void {
    const todosRoles = this.empleados.flatMap(emp => emp.roles.map((r: any) => r.nombre));
    this.rolesUnicos = [...new Set(todosRoles)];

    const todasHabilidades = this.empleados.flatMap(emp => emp.habilidades.map((h: any) => h.nombre));
    this.habilidadesUnicas = [...new Set(todasHabilidades)];

    const todasCertificaciones = this.empleados.flatMap(emp => emp.certificaciones.map((c: any) => c.nombre));
    this.certificacionesUnicas = [...new Set(todasCertificaciones)];
  }

  aplicarFiltros(): void {
    this.empleadosFiltrados = this.empleados.filter(emp => {
      if (this.filtros.soloDisponibles && !emp.disponible) return false;

      // Filtro por rol
      if (
        this.filtros.rol &&
        !emp.roles.some((r: any) => r.nombre === this.filtros.rol)
      ) return false;

      // Filtro por habilidad
      if (
        this.filtros.habilidad &&
        !emp.habilidades.some((h: any) => h.nombre === this.filtros.habilidad)
      ) return false;

      if (
        this.filtros.certificacion &&
        !emp.certificaciones.some((c: any) => c.nombre === this.filtros.certificacion)
      ) return false;
      
      // Filtro por texto de búsqueda (usuario, correo o nombre completo)
      if (this.searchText) {
        const searchLower = this.searchText.toLowerCase();
        const fullName = `${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno}`.toLowerCase();

        return (
          emp.usuario.toLowerCase().includes(searchLower) ||
          emp.correo.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower)
        );
      }

      return true;
    });
    this.currentPage = 1;
  }

  limpiarFiltros(): void {
    this.filtros = {
      rol: '',
      habilidad: '',
      certificacion: '',
      soloDisponibles: false
    };
    this.searchText = '';
    this.aplicarFiltros();
  }

  verDetallesEmpleado(empleado: any): void {
    this.router.navigate(['/empleado-detalles', empleado.empleado_id]);
  }

  seleccionarEmpleado(empleado: any): void {
    this.empleadoSeleccionado = empleado;
    this.nuevoEstado = empleado.estado_laboral || '';
    this.nuevaCargabilidad = empleado.cargabilidad || 0;
  }

  actualizarDisponibilidad(): void {
    if (!this.empleadoSeleccionado) return;

    const payload = {
      estado: this.nuevoEstado,
      cargabilidad: this.nuevaCargabilidad
    };

    this.apiService.actualizarDisponibilidad(this.empleadoSeleccionado.empleado_id, payload)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
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
        error: () => {
          this.error = 'Error de conexión con el servidor';
        }
      });
  }

  cancelarActualizacion(): void {
    this.empleadoSeleccionado = null;
    this.nuevoEstado = '';
    this.nuevaCargabilidad = null;
  }

  get paginatedEmpleados(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.empleadosFiltrados.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.empleadosFiltrados.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
}
