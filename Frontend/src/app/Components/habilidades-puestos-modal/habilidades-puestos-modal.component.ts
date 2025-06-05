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
    next: ([capabilities, habilidades]) => {
      // Procesar capabilities para extraer puestos
      if (capabilities && capabilities.puestos) {
        this.puestosDisponibles = Object.keys(capabilities.puestos).map(nombre => ({
          id: nombre,
          nombre: nombre
        }));
      }

      // Procesar habilidades
      if (Array.isArray(habilidades)) {
        this.habilidadesDisponibles = habilidades.map(h => ({
          habilidad_id: h.id || h.habilidad_id,
          nombre: h.nombre,
          nivel_esperado: h.nivel_esperado || 'Intermedio',
          // Agrega cualquier otro campo necesario
          descripcion: h.descripcion || `Habilidad de ${h.nombre}`
        }));
        
        // Ordenar alfabéticamente si es necesario
        this.habilidadesDisponibles.sort((a, b) => a.nombre.localeCompare(b.nombre));
      }

      // Configurar el formulario si estamos en modo habilidades
      if (this.modoEdicion === 'habilidades' && this.habilidadesDisponibles.length > 0) {
        this.configurarFormularioHabilidades();
      }
    },
    error: (error) => {
      console.error('Error al cargar datos disponibles', error);
      this.puestosDisponibles = [];
      this.habilidadesDisponibles = [];
    }
  });
}

private configurarFormularioHabilidades(): void {
  // Establecer el primer valor por defecto
  const primeraHabilidad = this.habilidadesDisponibles[0];
  this.form.patchValue({
    habilidadId: primeraHabilidad.habilidad_id,
    nivel: primeraHabilidad.nivel_esperado
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
    if (puesto.nombreAntiguo && puesto.nombreAntiguo !== puesto.nombre) {
      delete this.proyecto.capabilities.puestos[puesto.nombreAntiguo];
    }
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