import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { ProyectosComponent } from '../proyectos/proyectos.component';
import { ApiService } from 'src/app/services/api.service';

interface Proyecto {
  proyecto_id: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  progreso: number;
  capabilities: any;
}

@Component({
  selector: 'app-participacion-p',
  templateUrl: './participacion-p.component.html',
  styleUrls: ['./participacion-p.component.css']
})
export class ParticipacionPComponent implements OnInit {
  activeTab: string = 'disponibles';
  
  proyectosDisponibles: Proyecto[] = [];
  proyectosActuales: Proyecto[] = [];
  proyectosPasados: Proyecto[] = [];
  
  disponiblesCount: number = 0;
  actualesCount: number = 0;
  pasadosCount: number = 0;

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.cargarProyectosDisponibles();
    this.cargarProyectosActuales();
  }

  

  showAddProjectButton(): boolean {
    const allowedRoles = ['people lead', 'delivery lead'];
    return this.authService.roles.some(role => allowedRoles.includes(role));
  }

  openAddProjectModal(): void {
    const dialogRef = this.dialog.open(ProyectosComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { action: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarProyectosDisponibles();
        this.cargarProyectosActuales();
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
          this.proyectosDisponibles = response.proyectos || response || [];
          this.disponiblesCount = this.proyectosDisponibles.length;
        },
        error: (error) => {
          console.error('Error al cargar proyectos disponibles:', error);
          this.proyectosDisponibles = [];
          this.disponiblesCount = 0;
        }
      });
  }

  getSkills(capabilities: any): string[] {
    if (!capabilities) return [];
    return Object.keys(capabilities).filter(key => capabilities[key]);
  }
  
  // Agrega este método para filtrar proyectos por fecha
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

// Modifica el método cargarProyectosActuales
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
        
        this.proyectosActuales = actuales;
        this.proyectosPasados = pasados;
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

}