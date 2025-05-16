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

  proyecto = {
    nombre: '',
    descripcion: '',
    fecha: '',
    fechaFinalizacion: '',
    capabilities: [] as CapabilitiesSeleccionado[]
  };

  guardandoProyecto: boolean = false
  formSubmitted: boolean = false;
  
  capabilities: Capability[] = [];
  capabilitySeleccionadaId: Capability | null = null;

  constructor(private apiService: ApiService, private authService: AuthService){};

  ngOnInit(){
    this.cargarCapabilities();
  }

  cargarCapabilities(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.apiService.getCapabilities().subscribe({
        next: (res: any) => {
          if (res.success) {
            this.capabilities = res.data;
          } else {
            console.error('Error al cargar capabilities:', res.error);
          }
          resolve(); // Resolvemos la promesa sin importar si hubo éxito o error
        },
        error: (err: any) => {
          console.error('Error al obtener capabilities:', err);
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

    /** Avanza o retrocede de paso */
  goTo(p: number) {
    this.paso = p;
  }

  /** Marca/desmarca un Capability */
  toggleCapability(r: Capability) {
    r.selected = !r.selected;
    if (r.selected) {
      this.proyecto.capabilities.push({ id: r.id, nombre: r.nombre, cantidad: 1 });
    } else {
      this.proyecto.capabilities = this.proyecto.capabilities.filter(rs => rs.id !== r.id);
    }
  }

  /** Cambia la cantidad (mínimo 1) */
  changeCantidad(rs: CapabilitiesSeleccionado, delta: number) {
    rs.cantidad = Math.max(1, rs.cantidad + delta);
  }

  /** Valida paso 1: todos los campos requeridos */
  get paso1Valido() {
    const p = this.proyecto;
    return !!p.nombre && !!p.descripcion && !!p.fecha && !!p.fechaFinalizacion;
  }

  /** Envía el proyecto completo */
  onSubmit() {
    const id = this.authService.userId;
    if (!id) {
      console.error('User ID is null or undefined');
      return;
    }
    if (this.paso === 2) {
      const proyectoJson = {
        delivery_lead: id,
        nombre: this.proyecto.nombre,
        descripcion: this.proyecto.descripcion,
        fecha_inicio: this.proyecto.fecha,
        fecha_fin: this.proyecto.fechaFinalizacion,
        progreso: 0,
        cargabilidad: null,
        capabilities: {
          "status": "disponible",
          "puestos": 
          this.proyecto.capabilities.map(c => ({
            id: c.id,
            nombre: c.nombre,
            cantidad: c.cantidad
          }))
        }
      }

      this.apiService.subirProyecto(proyectoJson);
    }
  }
}
