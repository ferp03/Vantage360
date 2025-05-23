import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
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

interface HabilidadesSeleccionado {
  habilidad_id: number;
  nombre: string;
  nivel_esperado: string;
}

interface Habilidad {
  habilidad_id: number;
  nombre: string;
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
    capabilities: [] as CapabilitiesSeleccionado[],
    habilidades: [] as HabilidadesSeleccionado[]
  };

  guardandoProyecto: boolean = false;
  formSubmitted: boolean = false;
  habilidades: Habilidad[] = [];
  capabilities: Capability[] = [];
  capabilitySeleccionadaId: Capability | null = null;
  habilidadSeleccionadaId: Habilidad | null = null;
  nivelSeleccionado: string = '';

  @ViewChild('f') paso1Form!: NgForm;


  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCapabilities();
    this.getHabilidades();
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.paso = 1;
    this.proyecto = {
      nombre: '',
      descripcion: '',
      fecha: '',
      fechaFinalizacion: '',
      capabilities: [],
      habilidades: []
    };
    this.capabilitySeleccionadaId = null;
    this.cdr.detectChanges();
  }

  cargarCapabilities(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.apiService.getCapabilities().subscribe({
        next: (res: any) => {
          if (res.success) this.capabilities = res.data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  getHabilidades() {
    this.apiService.getHabilidades().subscribe({
      next: (res: any) => {
        if (res.success) this.habilidades = res.data;
        else console.error('Error al cargar habilidades:', res.error);
      },
      error: (err: any) => {
        console.error('Error al obtener habilidades:', err);
      }
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

  agregarHabilidad() {
    if (this.habilidadSeleccionadaId && this.nivelSeleccionado) {
      this.proyecto.habilidades.push({
        habilidad_id: this.habilidadSeleccionadaId.habilidad_id,
        nombre: this.habilidadSeleccionadaId.nombre,
        nivel_esperado: this.nivelSeleccionado
      });
      this.habilidadSeleccionadaId = null;
      this.nivelSeleccionado = '';
    }
  }

  eliminarCapability(id: number) {
    this.proyecto.capabilities = this.proyecto.capabilities.filter(c => c.id !== id);
  }

  eliminarHabilidad(id: number) {
    this.proyecto.habilidades = this.proyecto.habilidades.filter(h => h.habilidad_id !== id);
  }

  goTo(p: number) {
    this.paso = p;
  }

  toggleHabilidad(habilidad: Habilidad) {
    const idx = this.proyecto.habilidades.findIndex(h => h.habilidad_id === habilidad.habilidad_id);
    if (idx > -1) {
      this.proyecto.habilidades.splice(idx, 1);
    } else {
      this.proyecto.habilidades.push({
        habilidad_id: habilidad.habilidad_id,
        nombre: habilidad.nombre,
        nivel_esperado: 'Básico'
      });
    }
  }

  changeCantidad(rs: CapabilitiesSeleccionado, delta: number) {
    rs.cantidad = Math.max(1, rs.cantidad + delta);
  }

  get paso1Valido() {
    const p = this.proyecto;
    return !!p.nombre && !!p.descripcion && !!p.fecha && !!p.fechaFinalizacion;
  }

  habilidadesDisponibles(): Habilidad[] {
    const usadas = this.proyecto.habilidades.map(h => h.habilidad_id);
    return this.habilidades.filter(h => !usadas.includes(h.habilidad_id));
  }


  getNivelEsperado(habilidadId: number): string {
    const habilidad = this.proyecto.habilidades.find(h => h.habilidad_id === habilidadId);
    return habilidad ? habilidad.nivel_esperado : 'Básico';
  }

  setNivelEsperado(habilidadId: number, nuevoNivel: string) {
    const habilidad = this.proyecto.habilidades.find(h => h.habilidad_id === habilidadId);
    if (habilidad) {
      habilidad.nivel_esperado = nuevoNivel;
    }
  }

  tieneHabilidad(habilidadId: number): boolean {
    return this.proyecto.habilidades.some(h => h.habilidad_id === habilidadId);
  }


  onSubmit() {
    const id = this.authService.userId;
    if (!id) return;

    const puestosObj = this.proyecto.capabilities.reduce((acc, curr) => {
      acc[curr.nombre] = curr.cantidad;
      return acc;
    }, {} as Record<string, number>);

    const habilidadesObj = this.proyecto.habilidades.map(h => ({
      habilidad_id: h.habilidad_id,
      nombre: h.nombre,
      nivel: h.nivel_esperado
    }));

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
      },
      habilidades: habilidadesObj
    };

    this.guardandoProyecto = true;
    this.apiService.subirProyecto(proyectoJson).subscribe({
      next: res => {
        this.guardandoProyecto = false;
        if (res.success) {
          this.cerrarModal();
          window.location.reload();
        }
      },
      error: err => {
        this.guardandoProyecto = false;
        alert(`Error HTTP: ${err.message || JSON.stringify(err)}`);
      }
    });
  }
}
