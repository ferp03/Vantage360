import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router'; // <-- Importar Router

@Component({
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.component.html',
  styleUrls: ['./disponibilidad.component.css']
})
export class DisponibilidadComponent implements OnInit {
  empleados: any[] = [];
  empleadosFiltrados: any[] = [];
  filtros = {
    habilidad: '',
    certificacion: '',
    rol: '',
    soloDisponibles: false
  };
  
  habilidadesUnicas: string[] = [];
  certificacionesUnicas: string[] = [];
  rolesUnicos: string[] = [];
  
  searchText: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  cargando: boolean = true;
  error: string = '';
  
  // Para actualización manual con el modal
  empleadoSeleccionado: any = null;
  nuevoEstado: string = '';
  nuevaCargabilidad: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router  // <-- Inyectamos Router
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
          
          // Extraer listas únicas para filtros
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
    // Extraer habilidades únicas
    const todasHabilidades = this.empleados.flatMap(emp =>
      emp.habilidades.map((h: any) => h.nombre)
    );
    this.habilidadesUnicas = [...new Set(todasHabilidades)];

    // Extraer certificaciones únicas
    const todasCertificaciones = this.empleados.flatMap(emp =>
      emp.certificaciones.map((c: any) => c.nombre)
    );
    this.certificacionesUnicas = [...new Set(todasCertificaciones)];

    // Extraer roles únicos
    const todosRoles = this.empleados.flatMap(emp =>
      emp.roles.map((r: any) => r.nombre)
    );
    this.rolesUnicos = [...new Set(todosRoles)];
  }

  aplicarFiltros(): void {
    this.empleadosFiltrados = this.empleados.filter(emp => {
      // Filtro por disponibilidad
      if (this.filtros.soloDisponibles && !emp.disponible) {
        return false;
      }
      
      // Filtro por habilidad
      if (this.filtros.habilidad &&
          !emp.habilidades.some((h: any) => h.nombre === this.filtros.habilidad)) {
        return false;
      }
      
      // Filtro por certificación
      if (this.filtros.certificacion &&
          !emp.certificaciones.some((c: any) => c.nombre === this.filtros.certificacion)) {
        return false;
      }
      
      // Filtro por rol
      if (this.filtros.rol &&
          !emp.roles.some((r: any) => r.nombre === this.filtros.rol)) {
        return false;
      }
      
      // Filtro por texto de búsqueda
      if (this.searchText) {
        const searchLower = this.searchText.toLowerCase();
        const fullName = `${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno}`.toLowerCase();
        
        return emp.usuario.toLowerCase().includes(searchLower) ||
               emp.correo.toLowerCase().includes(searchLower) ||
               fullName.includes(searchLower);
      }
      
      return true;
    });
    // Reset paginación
    this.currentPage = 1;
  }

  limpiarFiltros(): void {
    this.filtros = {
      habilidad: '',
      certificacion: '',
      rol: '',
      soloDisponibles: false
    };
    this.searchText = '';
    this.aplicarFiltros();
  }

  // Nuevo método para ver detalles al hacer clic en el NOMBRE
  verDetallesEmpleado(empleado: any): void {
    // Asumiendo que tienes una ruta como: /empleado-detalles/:id
    this.router.navigate(['/empleado-detalles', empleado.empleado_id]);
  }

  // Método para abrir el modal de edición
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
              // Reevaluar o recargar
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
