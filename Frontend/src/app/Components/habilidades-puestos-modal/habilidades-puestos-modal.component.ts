import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { Proyecto, Habilidad } from '../participacion-p/participacion-p.component';
import { forkJoin } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

interface Puesto {
  id: number;
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
  puestosDisponibles: any[] = [];
  habilidadesDisponibles: any[] = [];
  puestosEditables: Puesto[] = []; 
  habilidadEditando: Habilidad | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<HabilidadesPuestosModalComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService
  ) {
    this.formPuesto = this.fb.group({
      puestoId: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]] 
    });
    this.proyecto = JSON.parse(JSON.stringify(data.proyecto));
    this.proyecto.habilidades = this.proyecto.habilidades || [];
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
  this.proyecto.habilidades = this.ensureHabilidadesArray(this.proyecto.habilidades);
  this.actualizarPuestosEditables();
  }

cargarDatosDisponibles(): void {
  forkJoin([
    this.apiService.getCapabilities(),
    this.apiService.getHabilidades()
  ]).subscribe({
    next: ([resCapabilities, resHabilidades]) => {
      // Procesar capabilities
      if (resCapabilities.success) {
        this.puestosDisponibles = resCapabilities.data.map((cap: any) => ({
          id: cap.id,
          nombre: cap.nombre
        }));
      }

      // Procesar habilidades
      if (resHabilidades.success) {
        this.habilidadesDisponibles = resHabilidades.data.map((hab: any) => ({
          habilidad_id: hab.id || hab.habilidad_id,
          nombre: hab.nombre,
          nivel_esperado: hab.nivel_esperado || 'Intermedio'
        }));
      }

      // Configurar valores iniciales del formulario
      if (this.modoEdicion === 'habilidades' && this.habilidadesDisponibles.length > 0) {
        this.form.patchValue({
          habilidadId: this.habilidadesDisponibles[0].habilidad_id,
          nivel: 'Intermedio'
        });
      }
    },
    error: (error) => {
      console.error('Error al cargar datos disponibles', error);
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
    ([nombre, cantidad]) => {
      const puesto = this.puestosDisponibles.find(p => p.nombre === nombre);
      return {
        id: puesto?.id || 0,
        nombre,
        cantidad: cantidad as number,
        editando: false
      };
    }
  );
}


  actualizarPuestosEditables(): void {
    const puestosActuales = this.puestos;
    this.puestosEditables = puestosActuales.map(puestoExistente => {
      const puestoEditado = this.puestosEditables.find(p => p.nombre === puestoExistente.nombre);
      return puestoEditado || { ...puestoExistente, editando: false };
    });
  }

agregarPuesto(): void {
  if (this.formPuesto.invalid) return;

  const puestoSeleccionado = this.puestosDisponibles.find(
    p => p.id === this.formPuesto.value.puestoId
  );

  if (!puestoSeleccionado) return;

  const nombrePuesto = puestoSeleccionado.nombre;
  const cantidad = this.formPuesto.value.cantidad;

  if (!this.proyecto.capabilities) {
    this.proyecto.capabilities = { status: 'active', puestos: {} };
  }

  this.proyecto.capabilities.puestos[nombrePuesto] = cantidad;
  
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
    const proyectoResponse = await this.actualizarProyectoBasico();
    try {
      await this.actualizarHabilidadesProyecto();
    } catch (errorHabilidades) {
      console.warn('Advertencia: No se pudieron actualizar las habilidades', errorHabilidades);
    }

    this.dialogRef.close(proyectoResponse);
  } catch (error) {
    console.error("Error al guardar:", error);
    alert('Error al guardar los cambios. Verifica la consola para más detalles.');
  }
}

private async actualizarProyectoBasico(): Promise<any> {
  const deliveryLeadId = typeof this.proyecto.delivery_lead === 'object'
    ? this.proyecto.delivery_lead?.id
    : this.proyecto.delivery_lead;

  const updateData = {
    proyecto_id: this.proyecto.proyecto_id,
    nombre: this.proyecto.nombre,
    descripcion: this.proyecto.descripcion,
    fecha_inicio: this.proyecto.fecha_inicio,
    fecha_fin: this.proyecto.fecha_fin,
    progreso: this.proyecto.progreso,
    capabilities: this.proyecto.capabilities,
    delivery_lead: deliveryLeadId,
    userId: String(this.authService.userId)
  };

  return this.apiService.actualizarProyecto(updateData).toPromise();
}

private async actualizarHabilidadesProyecto(): Promise<void> {
  if (!this.proyecto.habilidades || this.proyecto.habilidades.length === 0) {
    return;
  }

  const habilidadesData = this.proyecto.habilidades.map(h => ({
    proyecto_id: this.proyecto.proyecto_id,
    habilidad_id: h.habilidad_id,
    nivel_esperado: h.nivel_esperado
  }));

  await this.apiService.actualizarHabilidadesProyecto(
    this.proyecto.proyecto_id,
    habilidadesData,
  ).toPromise();
}

private verificarPermisosEdicion(): boolean {
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
  if (!puesto.nombre || puesto.nombre.trim() === '') {
    alert('Debe seleccionar un puesto');
    return;
  }

  if (puesto.cantidad < 1) {
    alert('La cantidad debe ser al menos 1');
    return;
  }

  if (this.proyecto.capabilities?.puestos) {
    // Eliminar el puesto antiguo si el nombre cambió
    if (puesto.nombreAntiguo && puesto.nombreAntiguo !== puesto.nombre) {
      delete this.proyecto.capabilities.puestos[puesto.nombreAntiguo];
    }
    
    // Agregar/actualizar el puesto
    this.proyecto.capabilities.puestos[puesto.nombre] = puesto.cantidad;
  }
  
  puesto.editando = false;
  delete puesto.nombreAntiguo;
}

cancelarEdicion(puesto: Puesto): void {
  if (puesto.nombreAntiguo) {
    puesto.nombre = puesto.nombreAntiguo;
  }
  puesto.editando = false;
}

editarHabilidad(habilidad: Habilidad): void {
  if (this.proyecto.habilidades) {
    this.proyecto.habilidades.forEach(h => h.editando = false);
  }
  habilidad.datosOriginales = {...habilidad};
  habilidad.editando = true;
  this.habilidadEditando = habilidad;
}

guardarEdicionHabilidad(habilidad: Habilidad): void {
  if (!habilidad.nombre || !habilidad.nivel_esperado) {
    alert('Todos los campos son requeridos');
    return;
  }
  habilidad.editando = false;
  delete habilidad.datosOriginales;
  this.habilidadEditando = null;
}

cancelarEdicionHabilidad(habilidad: Habilidad): void {
  // Restaurar los valores originales si existen
  if (habilidad.datosOriginales) {
    Object.assign(habilidad, habilidad.datosOriginales);
  }
  
  habilidad.editando = false;
  delete habilidad.datosOriginales;
  this.habilidadEditando = null;
}


}