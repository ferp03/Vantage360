import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { Proyecto, Habilidad } from '../participacion-p/participacion-p.component';
import { forkJoin } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

interface Puesto {
  nombre: string;
  cantidad: number;
  editando?: boolean;
  nombreAntiguo?: string;
}

@Component({
  selector: 'app-habilidades-puestos-modal',
  templateUrl: './habilidades-puestos-modal.component.html',
  styleUrls: ['./habilidades-puestos-modal.component.css']
})
export class HabilidadesPuestosModalComponent implements OnInit {
  proyecto: Proyecto;
  modoEdicion: 'puestos' | 'habilidades';
  form!: FormGroup;
  nuevaEntrada: string = '';
  puestoCantidad: number = 1;
  formPuesto: FormGroup;
  puestosDisponibles: any[] = [
    { id: 'frontend', nombre: 'Desarrollador Frontend' },
    { id: 'backend', nombre: 'Desarrollador Backend' },
    { id: 'design', nombre: 'Diseñador UX/UI' }
  ];
  habilidadesDisponibles: any[] = [
    { id: 1, nombre: 'JavaScript' },
    { id: 2, nombre: 'Angular' },
    { id: 3, nombre: 'TypeScript' },
    { id: 4, nombre: 'HTML/CSS' }
  ];
  puestosEditables: Puesto[] = []; // Nueva propiedad para edición


  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<HabilidadesPuestosModalComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService
  ) {
    this.formPuesto = this.fb.group({
    puestoId: [null, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]]  // Agrega control para cantidad
    });
    this.proyecto = JSON.parse(JSON.stringify(data.proyecto));
    this.modoEdicion = data.modo;
  }

  isArray(obj: any): boolean {
    return Array.isArray(obj);
  }

  ngOnInit(): void {
  this.cargarDatosDisponibles();
  this.form = this.fb.group({
    habilidadId: ['', Validators.required],
    nivel: ['Intermedio']
  });
  
  // Ensure habilidades is always an array
  this.proyecto.habilidades = this.ensureHabilidadesArray(this.proyecto.habilidades);
  this.actualizarPuestosEditables(); // Inicializa puestos editables
}


  cargarDatosDisponibles(): void {
    forkJoin([
      this.apiService.getCapabilities(),
      this.apiService.getHabilidades()
    ]).subscribe({
      next: ([capabilities, habilidades]) => {
        // Procesar capabilities para extraer puestos
        if (capabilities && capabilities.puestos) {
          this.puestosDisponibles = Object.keys(capabilities.puestos).map(nombre => ({
            nombre,
            id: nombre // Usamos el nombre como ID si no hay otro identificador
          }));
        }
        
        this.habilidadesDisponibles = habilidades || [];
      },
      error: (error) => {
        console.error('Error al cargar datos disponibles', error);
      }
    });
  }

private ensureHabilidadesArray(habilidades: any): Habilidad[] {
  // If undefined or null, return empty array
  if (!habilidades) return [];
  
  // If already an array, return it
  if (Array.isArray(habilidades)) return habilidades;
  
  // If it's an object, convert to array
  if (typeof habilidades === 'object') {
    return Object.keys(habilidades).map(key => ({
      ...habilidades[key],
      // Ensure each item has required properties
      habilidad_id: habilidades[key].habilidad_id || key,
      nombre: habilidades[key].nombre || 'Sin nombre',
      nivel_esperado: habilidades[key].nivel_esperado || 'Intermedio'
    }));
  }
  
  // Fallback for any other case
  return [];
}

  get puestos(): Puesto[] {
    if (!this.proyecto.capabilities?.puestos) return [];
    return Object.entries(this.proyecto.capabilities.puestos).map(
      ([nombre, cantidad]) => ({ nombre, cantidad })
    );
  }

  actualizarPuestosEditables(): void {
    // Mantener el estado de edición al actualizar
    const puestosActuales = this.puestos;
    this.puestosEditables = puestosActuales.map(puestoExistente => {
      const puestoEditado = this.puestosEditables.find(p => p.nombre === puestoExistente.nombre);
      return puestoEditado || { ...puestoExistente, editando: false };
    });
  }

agregarPuesto(): void {
  if (this.formPuesto.invalid) return;

  const nombrePuesto = this.formPuesto.value.puestoId;
  const cantidad = this.formPuesto.value.cantidad;

  if (!this.proyecto.capabilities) {
    this.proyecto.capabilities = { status: 'active', puestos: {} };
  }

  this.proyecto.capabilities.puestos[nombrePuesto] = cantidad;
  
  // Resetear el formulario
  this.formPuesto.reset({
    puestoId: null,
    cantidad: 1
  });

  this.actualizarPuestosEditables();
}

eliminarPuesto(nombre: string): void {
  if (this.proyecto.capabilities?.puestos) {
    delete this.proyecto.capabilities.puestos[nombre];
    this.actualizarPuestosEditables();
  }
}

  agregarHabilidad(): void {
    if (this.form.invalid) return;
    const habilidadSeleccionada = this.habilidadesDisponibles.find(
      h => h.habilidad_id === this.form.value.habilidadId
    );
    const nuevaHabilidad: Habilidad = {
      ...habilidadSeleccionada,
      nivel_esperado: this.form.value.nivel
    };
    if (!this.proyecto.habilidades) {
      this.proyecto.habilidades = [];
    }
    this.proyecto.habilidades.push(nuevaHabilidad);
    this.form.reset({ nivel: 'Intermedio' });
  }

  eliminarHabilidad(index: number): void {
  if (!this.proyecto.habilidades || !Array.isArray(this.proyecto.habilidades)) {
    this.proyecto.habilidades = [];
    return;
  }
  this.proyecto.habilidades = this.proyecto.habilidades.filter((_, i) => i !== index);
}

  onCancel(): void {
    this.dialogRef.close();
  }
  
async onSave(): Promise<void> {
  try {
    // Extract UUID from delivery_lead if it's an object
    const deliveryLeadId = typeof this.proyecto.delivery_lead === 'object'
      ? this.proyecto.delivery_lead.id
      : this.proyecto.delivery_lead;

    const updateData = {
      proyecto_id: this.proyecto.proyecto_id,
      nombre: this.proyecto.nombre,
      descripcion: this.proyecto.descripcion,
      fecha_inicio: this.proyecto.fecha_inicio,
      fecha_fin: this.proyecto.fecha_fin,
      progreso: this.proyecto.progreso,
      capabilities: this.proyecto.capabilities,
      delivery_lead: deliveryLeadId, // Now sending just the UUID string
      userId: String(this.authService.userId) // Required for auth
    };

    // console.log("Final Payload:", JSON.stringify(updateData, null, 2));

    const response = await this.apiService.actualizarProyecto(updateData).toPromise();
    this.dialogRef.close(response);
  } catch (error) {
    console.error("Full error:", error);
  }
}

private verificarPermisosEdicion(): boolean {
  // Forzar ambos a string para evitar problemas de tipo
  const deliveryLeadId = typeof this.proyecto.delivery_lead === 'object'
    ? this.proyecto.delivery_lead?.id
    : this.proyecto.delivery_lead;

  const userId = String(this.authService.userId ?? '');
  const leadId = String(deliveryLeadId ?? '');

  const esDeliveryLead = leadId === userId;
  const esAdmin = this.authService.roles?.includes('admin');
  console.log('Comparando:', { leadId, userId, esDeliveryLead, esAdmin });
  return esDeliveryLead || esAdmin;
}

editarPuesto(puesto: Puesto): void {
  // Salir del modo edición de todos los puestos primero
  this.puestosEditables.forEach(p => p.editando = false);
  
  // Guardar el nombre original antes de editar
  puesto.nombreAntiguo = puesto.nombre;
  
  // Activar edición para este puesto
  puesto.editando = true;
}

guardarEdicionPuesto(puesto: Puesto): void {
  // Validaciones básicas
  if (!puesto.nombre || puesto.nombre.trim() === '') {
    alert('El nombre del puesto no puede estar vacío');
    return;
  }

  if (puesto.cantidad < 1) {
    alert('La cantidad debe ser al menos 1');
    return;
  }

  // Buscar si ya existe un puesto con el nuevo nombre (excepto si es el mismo)
  const puestoExistente = this.puestosEditables.find(p => 
    p.nombre === puesto.nombre && p !== puesto
  );

  if (puestoExistente) {
    alert('Ya existe un puesto con ese nombre');
    return;
  }

  // Actualizar el objeto original en capabilities.puestos
  if (this.proyecto.capabilities?.puestos) {
    // Primero eliminar el nombre antiguo si cambió
    if (puesto.nombreAntiguo && puesto.nombreAntiguo !== puesto.nombre) {
      delete this.proyecto.capabilities.puestos[puesto.nombreAntiguo];
    }
    
    // Actualizar/crear el puesto
    this.proyecto.capabilities.puestos[puesto.nombre] = puesto.cantidad;
  }

  // Salir del modo edición
  puesto.editando = false;
  delete puesto.nombreAntiguo; // Limpiar el nombre antiguo
}
cancelarEdicion(puesto: Puesto): void {
  puesto.editando = false;
  this.actualizarPuestosEditables();
}

}