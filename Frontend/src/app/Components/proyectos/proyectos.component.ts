import { Component } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';

interface Capability {
  id: number; 
  nombre: string;
  selected: boolean;
}

interface CapabilitiesSeleccionado {
  id: number;
  nombre: string;
  cantidad: number;
}

@Component({
  selector: 'app-proyectos',
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.css']
})
export class ProyectosComponent {
  paso = 1;
  mostrarModal: boolean = true;

  proyecto = {
    nombre: '',
    descripcion: '',
    fecha: '',
    fechaFinalizacion: '',
    capabilities: [] as CapabilitiesSeleccionado[]
  };

  guardandoProyecto: boolean = false;
  formSubmitted: boolean = false;
  capabilities: Capability[] = [];
  capabilitySeleccionadaId: Capability | null = null;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit() {
    this.cargarCapabilities();
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cargarCapabilities(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.apiService.getCapabilities().subscribe({
        next: (res: any) => {
          if (res.success) {
            this.capabilities = res.data;
          }
          resolve();
        },
        error: () => {
          resolve();
        }
      });
    });
  }

  capabilitiesDisponibles(): Capability[] {
    const seleccionadas = this.proyecto.capabilities.map(c => c.id);
    return this.capabilities.filter(c => !seleccionadas.includes(c.id));
  }

  agregarCapability() {
    const cap = this.capabilitySeleccionadaId;
    if (cap && !this.proyecto.capabilities.some(c => c.id === cap.id)) {
      this.proyecto.capabilities.push({ id: cap.id, nombre: cap.nombre, cantidad: 1 });
      this.capabilitySeleccionadaId = null;
    }
  }

  eliminarCapability(id: number) {
    this.proyecto.capabilities = this.proyecto.capabilities.filter(c => c.id !== id);
  }

  goTo(p: number) {
    this.paso = p;
  }

  toggleCapability(r: Capability) {
    r.selected = !r.selected;
    if (r.selected) {
      this.proyecto.capabilities.push({ id: r.id, nombre: r.nombre, cantidad: 1 });
    } else {
      this.proyecto.capabilities = this.proyecto.capabilities.filter(rs => rs.id !== r.id);
    }
  }

  changeCantidad(rs: CapabilitiesSeleccionado, delta: number) {
    rs.cantidad = Math.max(1, rs.cantidad + delta);
  }

  get paso1Valido() {
    const p = this.proyecto;
    return !!p.nombre && !!p.descripcion && !!p.fecha && !!p.fechaFinalizacion;
  }

  onSubmit() {
    const id = this.authService.userId;
    if (!id) return;

    if (this.paso === 2) {
      const puestosObj = this.proyecto.capabilities.reduce((acc, curr) => {
        acc[curr.nombre] = { cantidad: curr.cantidad };
        return acc;
      }, {} as Record<string, { cantidad: number }>);

      const proyectoJson = {
        delivery_lead: id,
        nombre: this.proyecto.nombre,
        descripcion: this.proyecto.descripcion || null,
        fecha_inicio: this.proyecto.fecha || null,        
        fecha_fin: this.proyecto.fechaFinalizacion || null,
        progreso: 0,
        cargabilidad: null,
        capabilities: {
          status: 'disponible',
          puestos: puestosObj
        }
      };

      this.guardandoProyecto = true;
      this.apiService.subirProyecto(proyectoJson).subscribe({
        next: res => {
          this.guardandoProyecto = false;
          if (res.success) {
            this.cerrarModal();
          }
        },
        error: err => {
          this.guardandoProyecto = false;
          alert(`Error HTTP: ${err.message || JSON.stringify(err)}`);
        }
      });
    }
  }
}
