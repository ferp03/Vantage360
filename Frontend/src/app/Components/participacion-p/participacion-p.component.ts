import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { ProyectosComponent } from '../proyectos/proyectos.component';
import { ApiService } from 'src/app/services/api.service';
import { HabilidadesPuestosModalComponent } from '../habilidades-puestos-modal/habilidades-puestos-modal.component';

interface Capabilities {
  status: string;
  puestos: {
    [nombrePuesto: string]: number;
  };
}

interface Miembro {
  nombre: string;
  capability: string;
}


export interface Habilidad {
  nombre: string;
  habilidad_id: number;
  nivel_esperado: string;
  editando?: boolean;
  puedeEditar?: boolean;
  datosOriginales?: {        
    habilidad_id: number;
    nombre: string;
    nivel_esperado: string;
  };
}


export interface Proyecto {
  proyecto_id: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  progreso: number;
  capabilities: Capabilities;
  habilidades: Habilidad[];
  selectedVista: string;
  delivery_lead?: {
    id: string;
    nombre: string;
  };
  members: Miembro[];
  puedeEditar?: boolean;
  editando?: boolean;
  puesto?: string; 
  datosTemporales?: {  
    nombre: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
    progreso: number;
  };
  
}

@Component({
  selector: 'app-participacion-p',
  templateUrl: './participacion-p.component.html',
  styleUrls: ['./participacion-p.component.css']
})
export class ParticipacionPComponent implements OnInit {
  activeTab: string = 'disponibles';
  esDeliveryLead: boolean = false;
  selectedVista: 'puestos' | 'habilidades' = 'puestos';
  currentUserId: string = '';
  userId: string = '';


  proyectosDisponibles: Proyecto[] = [];
  proyectosActuales: Proyecto[] = [];
  proyectosPasados: Proyecto[] = [];
  
  disponiblesCount: number = 0;
  actualesCount: number = 0;
  pasadosCount: number = 0;

  members: Miembro[] = []; 
  loadingMembers: boolean = false;
  errorLoadingMembers: string | null = null;

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private apiService: ApiService
    
  ) {}

  ngOnInit(): void {
    this.cargarProyectosDisponibles();
    this.cargarProyectosActuales();
    this.currentUserId = this.authService.userId || '';
    this.userId = this.authService.userId || '';
    this.verificarDeliveryLead();
  }
  verificarDeliveryLead() {
    const roles = this.authService.roles;
    this.esDeliveryLead = roles.includes('delivery_lead');
  }

  setVistaProyecto(proyecto: Proyecto, vista: 'puestos' | 'habilidades') {
    (proyecto as any).selectedVista = vista;
  }

  showAddProjectButton(): boolean {
    const allowedRoles = ['people lead', 'delivery lead'];
    return this.authService.roles.some(role => allowedRoles.includes(role));
  }

  openAddProjectModal(): void {
  const dialogRef = this.dialog.open(ProyectosComponent, {
    width: '800px',
    maxWidth: '90vw',
    data: { action: 'create' },
    panelClass: 'no-backdrop-dialog', 
    disableClose: false, 
    hasBackdrop: true,   
    backdropClass: 'clean-backdrop'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.cargarProyectosDisponibles();
      this.cargarProyectosActuales();
    }
    
    document.querySelectorAll('.cdk-overlay-backdrop, .modal-overlay').forEach(el => {
      el.remove();
    });
    
    document.body.style.overflow = '';
    document.body.classList.remove('cdk-global-scrollblock');
    
    const componentInstance = dialogRef.componentInstance as ProyectosComponent;
    if (componentInstance) {
      componentInstance.mostrarModal = false;
      if (componentInstance['cdr']) {
        componentInstance['cdr'].detectChanges();
      }
    }
  });
}

  cargarProyectosDisponibles(): void {
    if (!this.authService.userId) {
      console.error('User ID is not available');
      this.proyectosDisponibles = [];
      this.disponiblesCount = 0;
      return;
    }

    this.apiService.getProyectosDisponibles(this.authService.userId)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          this.proyectosDisponibles = response.proyectos || response || [];
          this.proyectosDisponibles.forEach(p => (p as any).selectedVista = 'puestos');
          this.disponiblesCount = this.proyectosDisponibles.length;
        },
        error: (error) => {
          console.error('Error al cargar proyectos disponibles:', error);
          this.proyectosDisponibles = [];
          this.disponiblesCount = 0;
        }
      });
  }

  getPuestos(capabilities: Capabilities): string[] {
    if (!capabilities || !capabilities.puestos) return [];
    return Object.entries(capabilities.puestos).map(
      ([nombre, cantidad]) => `${nombre} (${cantidad})`
    );
  }
  
private filtrarProyectosPorFecha(proyectos: Proyecto[]): {
  actuales: Proyecto[];
  pasados: Proyecto[];
} {
  const hoy = new Date();
  const actuales: Proyecto[] = [];
  const pasados: Proyecto[] = [];

  proyectos.forEach(proyecto => {
    const fechaFin = new Date(proyecto.fecha_fin);
    if (fechaFin >= hoy) {
      actuales.push(proyecto);
    } else {
      pasados.push(proyecto);
    }
  });

  return { actuales, pasados };
}

// CargarProyectosActuales
cargarProyectosActuales(): void {
  if (!this.authService.userId) {
    console.error('User ID is not available');
    this.proyectosActuales = [];
    this.proyectosPasados = [];
    this.actualesCount = 0;
    this.pasadosCount = 0;
    return;
  }

  this.apiService.getProyectosActuales(this.authService.userId)
    .subscribe({
      next: (response: any) => {
        const proyectos = response.proyectos || response || [];
        const { actuales, pasados } = this.filtrarProyectosPorFecha(proyectos);
        
        this.proyectosActuales = actuales.map(p => ({ 
          ...p, 
          selectedVista: 'puestos',
          puedeEditar: this.verificarPermisoEdicion(p)
        }));
        
        this.proyectosPasados = pasados.map(p => ({ 
          ...p, 
          selectedVista: 'puestos',
          puedeEditar: this.verificarPermisoEdicion(p)
        }));
        
        this.actualesCount = this.proyectosActuales.length;
        this.pasadosCount = this.proyectosPasados.length;
      },
      error: (error) => {
        console.error('Error al cargar proyectos actuales:', error);
        this.proyectosActuales = [];
        this.proyectosPasados = [];
        this.actualesCount = 0;
        this.pasadosCount = 0;
      }
    });
}

// Método para verificar permisos de edición
verificarPermisoEdicion(proyecto: Proyecto): boolean {
  const esDeliveryLeadDelProyecto = proyecto.delivery_lead?.id === this.authService.userId;
  const esAdmin = this.authService.roles.includes('admin');
  
  
  return esDeliveryLeadDelProyecto || esAdmin;
}
// Modal
showJoinModal: boolean = false;
showMemberModal: boolean = false;
selectedProject: Proyecto | null = null;

openJoinModal(proyecto: Proyecto): void {
  if (this.showJoinModal) {
    return;
  }
  this.selectedProject = proyecto;
  this.showJoinModal = true;
}

openMemberModal(proyecto: Proyecto): void {
  if (this.showMemberModal || !proyecto.proyecto_id) return;

  // Inicializa con copia del proyecto y members vacío si no existe
  this.selectedProject = {
    ...proyecto,
    members: proyecto.members || [] // Asegura array vacío si es undefined/null
  };
  
  this.showMemberModal = true;
  this.loadingMembers = true;
  this.errorLoadingMembers = null;

  this.apiService.obtenerIntegrantesProyecto(proyecto.proyecto_id).subscribe({
  next: (response: any) => {
  if (this.selectedProject) {
    this.selectedProject = {
      ...this.selectedProject,
      members: response.data || []
    };
    console.log('Project members:', this.selectedProject.members);
  }

  this.loadingMembers = false;

  },
  error: (error) => {
    console.error('Error loading members:', error);
    this.errorLoadingMembers = 'Error al cargar los miembros';
    this.loadingMembers = false;
    if (this.selectedProject) {
      // También aquí se puede asignar un nuevo objeto o un nuevo array vacío.
      this.selectedProject = {
        ...this.selectedProject,
        members: []
      };
    }
  }
});
}

sortKeys = (a: any, b: any): number => a.key.localeCompare(b.key);

getMembersGroupedAndSorted() {
  if (!this.selectedProject?.members) return {};

  const grouped: { [key: string]: Miembro[] } = {};

  for (const member of this.selectedProject.members) {
    const capability = member.capability || 'Sin categoría';
    if (!grouped[capability]) {
      grouped[capability] = [];
    }
    grouped[capability].push(member);
  }

  for (const cap in grouped) {
    grouped[cap].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return grouped;
}


closeJoinModal(event?: Event): void {
  // if (event) {
  //   event.preventDefault();
  //   event.stopPropagation();
  // }
  this.showJoinModal = false;
  this.selectedProject = null;
}

closeMemberModal(event?: Event): void {
  // if (event) {
  //   event.preventDefault();
  //   event.stopPropagation();
  // }
  this.showMemberModal = false;
  this.selectedProject = null;
}

confirmJoin(): void {
  if (!this.selectedProject) return;

  const userId = this.authService.userId;
  const proyectoId = this.selectedProject.proyecto_id;

  if (!userId) {
    return;
  }

  this.apiService.unirseAProyecto(userId, proyectoId)
    .subscribe({
      next: (response) => {
        this.showJoinModal = false;
        this.selectedProject = null;
        
        setTimeout(() => {
          this.cargarProyectosDisponibles();
          this.cargarProyectosActuales();
        }, 1);
      },
      error: (error) => {
        console.error('Error detallado:', error);
        
        const errorMsg = error.error?.error || 
                        error.error?.message || 
                        'Error al unirse al proyecto';
      }
    });
}

openTab(tabId: string) {
  this.activeTab = tabId;
  if (tabId === 'disponibles' && this.disponiblesCount === 0) {
    this.cargarProyectosDisponibles();
  }
  if (tabId === 'actuales' && this.actualesCount === 0) {
    this.cargarProyectosActuales();
  }
  if (tabId === 'pasados' && this.pasadosCount === 0) {
    // a
  }
}

// editar proyecto
habilitarEdicion(proyecto: Proyecto): void {
  if (!proyecto.puedeEditar || !this.verificarPermisoEdicion(proyecto)) return;
  
  proyecto.editando = true;
  proyecto.datosTemporales = {
    nombre: proyecto.nombre || '', 
    descripcion: proyecto.descripcion || '',
    fecha_inicio: proyecto.fecha_inicio || new Date().toISOString().split('T')[0],
    fecha_fin: proyecto.fecha_fin || new Date().toISOString().split('T')[0],
    progreso: proyecto.progreso || 0
  };
}

cancelarEdicion(proyecto: Proyecto): void {
  proyecto.editando = false;
  proyecto.datosTemporales = undefined;
}

guardarCambios(proyecto: Proyecto): void {
  if (!proyecto.datosTemporales || !this.verificarPermisoEdicion(proyecto)) return;

  let userId = this.userId || this.currentUserId || this.authService.userId;
  if (!userId) {
    userId = this.authService.userId;
  }
  
  if (!userId) {
    console.error('No se pudo obtener el ID del usuario');
    return;
  }

  const datosActualizados = {
  ...proyecto.datosTemporales,
  proyecto_id: proyecto.proyecto_id,
  userId: userId 
  };

  this.apiService.actualizarProyecto(datosActualizados).subscribe({
    next: () => {
      proyecto.editando = false;
      proyecto.datosTemporales = undefined;
      this.cargarProyectosActuales();
    },
    error: (error) => {
      console.error('Error al actualizar:', error);
      this.cancelarEdicion(proyecto);
    }
  });
}

abrirModalEdicionHabilidadesPuestos(proyecto: Proyecto, modo: 'puestos' | 'habilidades'): void {
  if (!proyecto.puedeEditar) return;

  const dialogRef = this.dialog.open(HabilidadesPuestosModalComponent, {
    width: '800px',
    data: { 
      proyecto: {...proyecto}, 
      modo,
      userId: this.authService.userId // Pasamos el userId directamente
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Actualiza el proyecto localmente
      const index = this.proyectosActuales.findIndex(p => p.proyecto_id === result.proyecto_id);
      if (index !== -1) {
        this.proyectosActuales[index] = {
          ...this.proyectosActuales[index],
          capabilities: result.capabilities,
          habilidades: result.habilidades
        };
      }
    }
  });
}

async eliminarProyecto(proyecto: Proyecto): Promise<void> {
  if (!proyecto.puedeEditar || !this.verificarPermisoEdicion(proyecto)) {
    alert('No tienes permisos para eliminar este proyecto');
    return;
  }

  const confirmacion = confirm(`¿Estás seguro que deseas eliminar el proyecto "${proyecto.nombre}"?`);
  if (!confirmacion) return;

  try {
    await this.apiService.eliminarProyecto(proyecto.proyecto_id).toPromise();
    
    // Actualización optimizada del estado
    this.proyectosActuales = this.proyectosActuales.filter(p => p.proyecto_id !== proyecto.proyecto_id);
    this.proyectosDisponibles = this.proyectosDisponibles.filter(p => p.proyecto_id !== proyecto.proyecto_id);
    this.proyectosPasados = this.proyectosPasados.filter(p => p.proyecto_id !== proyecto.proyecto_id);
    
    this.actualesCount = this.proyectosActuales.length;
    this.disponiblesCount = this.proyectosDisponibles.length;
    this.pasadosCount = this.proyectosPasados.length;
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
  }
}

}