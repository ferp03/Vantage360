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
    { id: 'Programador UX/UI', nombre: 'Programador UX/UI' },
    { id: 'Analista QA', nombre: 'Analista QA' },
    { id: 'Líder Técnico', nombre: 'Líder Técnico' }
  ];
  habilidadesDisponibles: any[] = [
    { habilidad_id: 1, nombre: 'Python', nivel_esperado: 'Avanzado' },
    { habilidad_id: 2, nombre: 'Angular', nivel_esperado: 'Intermedio' },
    { habilidad_id: 3, nombre: 'SQL', nivel_esperado: 'Básico' }
  ];
  puestosEditables: Puesto[] = []; 


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
    this.proyecto.habilidades = this.proyecto.habilidades || [];
    this.modoEdicion = data.modo;
  }

  isArray(obj: any): boolean {
    return Array.isArray(obj);
  }

  ngOnInit(): void {
  console.log('Datos del proyecto recibidos:', this.proyecto); // depuración
  this.cargarDatosDisponibles();
  this.form = this.fb.group({
    habilidadId: ['', Validators.required],
    nivel: ['Intermedio']
  });
  this.proyecto.habilidades = this.ensureHabilidadesArray(this.proyecto.habilidades);
  console.log('Habilidades después de ensure:', this.proyecto.habilidades); // Depuración
  this.actualizarPuestosEditables();
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
          id: nombre,
          nombre: nombre
        }));
        console.log('Puestos disponibles:', this.puestosDisponibles); // Depuración
      }

      // Procesar habilidades
      if (Array.isArray(habilidades)) {
        this.habilidadesDisponibles = habilidades.map(h => ({
          habilidad_id: h.id || h.habilidad_id,
          nombre: h.nombre,
          nivel_esperado: h.nivel_esperado || 'Intermedio'
        }));
        console.log('Habilidades disponibles:', this.habilidadesDisponibles); // Depuración
      }

      // Si estamos en modo habilidades, seleccionar la primera opción por defecto
      if (this.modoEdicion === 'habilidades' && this.habilidadesDisponibles.length > 0) {
        this.form.patchValue({
          habilidadId: this.habilidadesDisponibles[0].habilidad_id
        });
      }
    },
    error: (error) => {
      console.error('Error al cargar datos disponibles', error);
      // Inicializar arrays vacíos para evitar errores
      this.puestosDisponibles = [];
      this.habilidadesDisponibles = [];
    }
  });
  }

private ensureHabilidadesArray(habilidades: any): Habilidad[] {
  if (!habilidades) return [];
  
  if (Array.isArray(habilidades)) {
    return habilidades.map(h => ({
      habilidad_id: h.habilidad_id || h.id,
      nombre: h.nombre || 'Sin nombre',
      nivel_esperado: h.nivel_esperado || 'Intermedio'
    }));
  }
  
  if (typeof habilidades === 'object') {
    return Object.values(habilidades).map((h: any) => ({
      habilidad_id: h.habilidad_id || h.id,
      nombre: h.nombre || 'Sin nombre',
      nivel_esperado: h.nivel_esperado || 'Intermedio'
    }));
  }
  
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
  this.puestosEditables.forEach(p => p.editando = false);
  puesto.nombreAntiguo = puesto.nombre;
  puesto.editando = true;
}

guardarEdicionPuesto(puesto: Puesto): void {
  // Validaciones básicas
  if (!puesto.nombre || puesto.nombre.trim() === '') {
    alert('Debe seleccionar un puesto');
    return;
  }

  if (puesto.cantidad < 1) {
    alert('La cantidad debe ser al menos 1');
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
  delete puesto.nombreAntiguo;
}

cancelarEdicion(puesto: Puesto): void {
  // Si cancelamos, restaurar el nombre original si existe
  if (puesto.nombreAntiguo) {
    puesto.nombre = puesto.nombreAntiguo;
  }
  puesto.editando = false;
}

}