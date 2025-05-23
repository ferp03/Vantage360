import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Location } from '@angular/common';
import {
  Chart,
  PieController,
  BarElement,
  BarController,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale, 
  Title
} from 'chart.js';


interface ExperienciaLaboral {
  historial_id?: number;
  titulo: string;
  empresa: string;
  titulo_proyecto: string;
  inicio: string;
  fin: string;
  descripcion: string;
  esNueva?: boolean;
  esPuestoActual?: boolean;
  capability_id?: number; 
}

interface Capability {
  id: number;
  nombre: string;
}

interface Ciudades {
  id: string;
  nombre: string
}

interface ErroresExperiencia {
  titulo?: boolean;
  empresa?: boolean;
  titulo_proyecto?: boolean;
  inicio?: boolean;
  fin?: boolean;
  descripcion?: boolean;
  fechaInvalida?: boolean;
}

interface Ceritifcado {
  nombre: string;
  plataforma: string;
}

interface Curso {
  nombre: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  progreso: string;
  obligatorio: boolean;
}

interface Habilidad {
  id?: number;
  nombre: string;
  nivel: string;
  descripcion: string;
}

@Component({
  selector: 'app-empleado-detalles',
  templateUrl: './empleado-detalles.component.html',
  styleUrls: ['./empleado-detalles.component.css']
})
export class EmpleadoDetallesComponent implements OnInit {
  info = {
    nombre: '',
    correo: '',
    usuario: '',
    desde: '',
    cargabilidad: '',
    nivel: ' ',
    nivel_ingles: ' ',
    staff_days: ' ',
    ytd_unassigned: ' ',
    ytd_recovery: ' ',
    bd: ' ',
    estado_laboral: ' ',
    lead_usuario: ' ',
    lead_id: ' ',
    ubicacion: ' ',
    titulo_proyecto: ' ',
    fecha_inicio: ' ',
    capability_proyecto: ' '
  };

  pieChart: Chart | null = null;
  pieChart2: Chart | null = null;
  barChart: Chart | null = null;

  erroresInfo = {
    correo: false,
    usuario: false,
    formatoEmail: false,
  };


  activeChart = "pie2";  
  habilidades: Habilidad[] = [];
  certificados: Ceritifcado[] = [];
  cursos: Curso[] = [];
  experiencias: ExperienciaLaboral[] = [];
  capabilities: Capability[] = [];
  ciudades: Ciudades[] = [];

  experienciasOriginales: { [key: number]: ExperienciaLaboral } = {};
  private trayectoriaOriginal: ExperienciaLaboral[] = [];

  editandoInfo = false;
  editandoTrayectoria = false;
  editandoIndice: number | null = null;
  errores: { [index: number]: ErroresExperiencia } = {};

  mostrarModalContrasena = false;
  contrasenaActual = '';
  nuevaContrasena = '';
  confirmarContrasena = '';

  erroresPass = {
    actual: false,
    nueva: false,
    confirmar: false,
    mensajeError: ""
  };

  nuevoEstado: string = '';
  nuevoUsuario: string = '';
  nuevaCiudad: Ciudades = { id: '', nombre: '' };

  private empleadoId: string | null = null;
  esMiPerfil: boolean = false; 

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.empleadoId = params.get('id');
      const idUsuarioLogueado = this.authService.userId;
      this.esMiPerfil = (idUsuarioLogueado == this.empleadoId);

      // Asegurar que solamente perfiles de admin o el propio usario pueda acceder a esta pagina
      const roles = this.authService.roles;
      const rolesPremitidos = ['delivery lead', 'people lead'];
      if(!this.esMiPerfil && !roles.some(rol => rolesPremitidos.includes(rol))){
        this.location.back();
      }
    });
    
    this.cargarInfoBasica();
    this.cargarHabilidades();
      // Primero cargamos las capabilities, y después la trayectoria
    this.cargarCapabilities().then(() => {
      this.cargarTrayectoria(); 
    });
    this.cargarCiudades();
    Chart.register(PieController, ArcElement, Tooltip, Legend, Title);
    Chart.register(BarElement, BarController, ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale);
    this.obtenerCurso().then(() => {
      this.activeChart = "pie2"
      setTimeout(() => this.renderizarGraficas(), 50); // Aquí va la función que quieres ejecutar después
    });
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
      this.cargarCertificados();
    });
  }

  cargarInfoBasica() {
    if (!this.empleadoId) return;
    this.apiService.getEmpleadoInfo(this.empleadoId).subscribe({
      next: (res) => {
        if (res.success) {
          this.info = {
            nombre: res.data.nombre,
            correo: res.data.correo,
            usuario: res.data.usuario,
            desde: this.formatearFecha(res.data.desde),
            cargabilidad: res.data.cargabilidad,
            nivel : res.data.nivel,
            nivel_ingles: res.data.nivel_ingles,
            staff_days: res.data.staff_days,
            ytd_unassigned: res.data.ytd_unassigned,
            ytd_recovery: res.data.ytd_recovery,
            bd: res.data.bd,
            estado_laboral: res.data.estado_laboral,
            lead_usuario: res.data.lead_usuario,
            lead_id: res.data.lead_id,
            ubicacion: res.data.ubicacion,
            titulo_proyecto: res.data.titulo_proyecto ? res.data.titulo_proyecto : "No hay proyecto actual",
            fecha_inicio: res.data.fecha_inicio ? res.data.fecha_inicio : "Fecha no disponible",
            capability_proyecto: res.data.capability_proyecto ? res.data.capability_proyecto : "No hay puesto actual",

          };
        this.nuevoEstado = this.info.estado_laboral;
        this.nuevoUsuario = this.info.usuario;
        this.nuevaCiudad = {id: '', nombre: this.info.ubicacion};

        }
      },
      error: (err) => console.error('Error al obtener info:', err)
    });
  }

  cargarHabilidades() {
    if (!this.empleadoId) return;
    
    this.apiService.getEmpleadoHabilidades(this.empleadoId).subscribe({
      next: (res) => {
        if (res.success) {
          console.log('Datos de habilidades recibidos:', res.data); // Para depuración
          
          // Asegurar que todos los campos existan
          this.habilidades = res.data.map((hab: any) => ({
            id: hab.id || null,
            nombre: hab.nombre || 'Habilidad sin nombre',
            nivel: hab.nivel || hab.nivel_habilidad || 'Nivel no especificado',
            descripcion: hab.descripcion || 'Sin descripción disponible',
          }));
          
          console.log('Habilidades procesadas:', this.habilidades); // Verificar el resultado
        }
      },
      error: (err) => {
        console.error('Error al obtener habilidades:', err);
        // Opcional: mostrar mensaje al usuario
      }
    });
  }

  cargarCertificados() {
    if (!this.empleadoId) return;
    this.apiService.getEmpleadoCertificaciones(this.empleadoId).subscribe({
      next: (res) => {
        if (res.success) {
          this.certificados = res.data;
        }
      },
      error: (err) => console.error('Error al obtener certificaciones:', err)
    });
  }

  cargarCiudades() {
    if(!this.empleadoId) return;
      this.apiService.getCiudades().subscribe({
        next: (res: any) => {
          if (res.success) {
            this.ciudades = res.data;
          } else {
            console.error('Error al cargar ciudades:', res.error);
          }
        },
        error: (err: any) => {
          console.error('Error al obtener ciudades:', err);
        }
      });
  }

  cargarTrayectoria() {
    if (!this.empleadoId) return;
    this.apiService.getEmpleadoTrayectoria(this.empleadoId).subscribe({
      next: (res) => {
        if (res.success) {
          this.experiencias = res.data;
          this.experiencias.forEach(exp => {
            if (!exp.fin) {
              exp.esPuestoActual = true;
            } else {
              exp.esPuestoActual = false;
            }
            
            // Asignar el nombre correcto de la capability basado en su ID
            if (exp.capability_id) {
              const capability = this.capabilities.find(c => c.id === exp.capability_id);
              if (capability) {
                exp.titulo = capability.nombre;
              } else {
                exp.titulo = `Capability ${exp.capability_id}`;
              }
            }
          });
          this.ordenarExp();
        }
      },
      error: (err) => console.error('Error al obtener trayectoria:', err)
    });
  }
  
  obtenerNombreCapability(id: number | undefined): string {
    if (!id) return '';
    const capability = this.capabilities.find(c => c.id === id);
    return capability ? capability.nombre : '';
  }

  ordenarExp() {
    this.experiencias.sort((a, b) => {
      const fechaA = new Date(a.inicio);
      const fechaB = new Date(b.inicio);
      return fechaB.getTime() - fechaA.getTime();
    });
  }

  formatearFecha(fecha: string): string {
    const opciones = { year: 'numeric', month: 'long' } as const;
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', opciones);
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  }

  togglePuestoActual(index: number): void {
    const exp = this.experiencias[index];
    
    if (exp.esPuestoActual) {
      exp.fin = '';
      this.errores[index].fin = false;
      this.errores[index].fechaInvalida = false;
    } else {
      if (exp.fin) {
        this.errores[index].fin = false;
        this.validarFechas(index);
      } else {
        this.errores[index].fin = true;
      }
    }
  }

  iniciarEdicionExperiencia(index: number) {
    if (!this.esMiPerfil || !this.editandoTrayectoria) return;
    
    this.editandoIndice = index;
    if (!this.errores[index]) {
      this.errores[index] = {};
    }
    this.experienciasOriginales[index] = { ...this.experiencias[index] };
  }


  guardarExperiencia(index: number) {
    if (!this.esMiPerfil || !this.editandoTrayectoria) return;
    
    const exp = this.experiencias[index];
    
    this.errores[index] = {
      titulo: !exp.titulo?.trim(),
      titulo_proyecto: !exp.titulo_proyecto?.trim(),
      empresa: !exp.empresa?.trim(),
      inicio: !exp.inicio?.trim(),
      fin: !exp.esPuestoActual && !exp.fin?.trim(),
      descripcion: !exp.descripcion?.trim(),
      fechaInvalida: false
    };

    this.validarFechas(index);

    if (Object.values(this.errores[index]).some(e => e)) {
      return;
    }

    const esNueva = exp.esNueva;
    const huboModificaciones = this.detectarCambiosEnExperiencia(index);

    if (!esNueva && !huboModificaciones) {
      console.log('No se detectaron cambios, cerrando edición');
      this.editandoIndice = null;
      return;
    }

    const payload = {
      titulo_puesto: exp.titulo,
      titulo_proyecto: exp.titulo_proyecto,
      empresa: exp.empresa,
      descripcion: exp.descripcion,
      fecha_inicio: exp.inicio,
      fecha_fin: exp.esPuestoActual ? null : exp.fin,
      es_puesto_actual: exp.esPuestoActual,
      capability_id: exp.capability_id
    };

    if (esNueva) {
      if (!this.empleadoId) return;
      this.apiService.createExperiencia(this.empleadoId, payload).subscribe({
        next: (res) => {
          console.log('Experiencia creada:', res);
          if (res && res.data) {
            exp.historial_id = res.data.historial_id;
            delete exp.esNueva;
            this.ordenarExp();
          }
          this.editandoIndice = null;
          this.cargarTrayectoria();
        },
        error: (err) => {
          console.error('Error al crear experiencia:', err);
        }
      });
    } 
    else if (exp.historial_id) {
      this.apiService.updateExperiencia(exp.historial_id, payload).subscribe({
        next: () => {
          console.log('Experiencia actualizada.');
          this.ordenarExp();
          this.editandoIndice = null;
          this.cargarTrayectoria();
        },
        error: (err) => console.error('Error al actualizar experiencia:', err)
      });
    }
  }

  detectarCambiosEnExperiencia(index: number): boolean {
    const original = this.experienciasOriginales[index];
    const actual = this.experiencias[index];

    if (!original) return true;
    return (
      original.titulo !== actual.titulo ||
      original.titulo_proyecto !== actual.titulo_proyecto ||
      original.empresa !== actual.empresa ||
      original.descripcion !== actual.descripcion ||
      original.inicio !== actual.inicio ||
      original.fin !== actual.fin ||
      original.esPuestoActual !== actual.esPuestoActual ||
      original.capability_id !== actual.capability_id
    );
  }

  toggleEditarTrayectoria(index: number) {
    if (!this.esMiPerfil) return;
    
    console.log('toggleEditarTrayectoria llamado con índice:', index);
    
    if (this.editandoIndice === index) {
      this.guardarExperienciaForzado(index);
    } else {
      this.iniciarEdicionExperiencia(index);
    }
  }

  guardarExperienciaForzado(index: number) {
    if (!this.esMiPerfil || !this.editandoTrayectoria) return;
    
    console.log('Guardando experiencia forzadamente:', index);
    
    const exp = this.experiencias[index];
    
    this.errores[index] = {
      titulo: !exp.titulo?.trim(),
      titulo_proyecto: !exp.titulo_proyecto?.trim(),
      empresa: !exp.empresa?.trim(),
      inicio: !exp.inicio?.trim(),
      fin: !exp.esPuestoActual && !exp.fin?.trim(),
      descripcion: !exp.descripcion?.trim(),
      fechaInvalida: false
    };

    this.validarFechas(index);

    if (Object.values(this.errores[index]).some(e => e)) {
      console.log('Hay errores de validación, no se puede guardar');
      return;
    }
    
    const payload = {
      titulo_puesto: exp.titulo,
      titulo_proyecto: exp.titulo_proyecto,
      empresa: exp.empresa,
      descripcion: exp.descripcion,
      fecha_inicio: exp.inicio,
      fecha_fin: exp.esPuestoActual ? null : exp.fin,
      es_puesto_actual: exp.esPuestoActual,
      capability_id: exp.capability_id
    };

    console.log('Payload a guardar:', payload);
    
    if (exp.esNueva) {
      if (!this.empleadoId) return;
      this.apiService.createExperiencia(this.empleadoId, payload).subscribe({
        next: (res) => {
          console.log('Experiencia creada exitosamente');
          this.editandoIndice = null;
          this.cargarTrayectoria();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al crear experiencia:', err);
        }
      });
    } 
    else if (exp.historial_id) {
      this.apiService.updateExperiencia(exp.historial_id, payload).subscribe({
        next: () => {
          console.log('Experiencia actualizada exitosamente');
          this.editandoIndice = null;
          this.cargarTrayectoria();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al actualizar experiencia:', err);
        }
      });
    }
  }

  cancelarEdicionExperiencia(index: number) {
    if (!this.esMiPerfil || !this.editandoTrayectoria) return;
    
    if (this.experiencias[index]?.esNueva) {
      this.experiencias.splice(index, 1);
    } else if (this.experienciasOriginales[index]) {
      this.experiencias[index] = { ...this.experienciasOriginales[index] };
    }
    
    this.editandoIndice = null;
    delete this.errores[index];
  }

  eliminarExperiencia(index: number) {
    if (!this.esMiPerfil || !this.editandoTrayectoria) return;
    
    const exp = this.experiencias[index];
    
    // Para experiencias nuevas (que no están en el servidor)
    if (exp.esNueva) {
      this.experiencias.splice(index, 1);
      this.editandoIndice = null;
      return;
    }
    
    // Para experiencias existentes
    if (exp.historial_id) {
      if (confirm('¿Estás seguro de que deseas eliminar esta experiencia laboral?')) {
        
        const experienciaEliminada = {...exp};
        
        // Eliminamos del array local para dar feedback inmediato
        this.experiencias.splice(index, 1);
        this.editandoIndice = null;
        this.cdr.detectChanges(); // Forzar actualización de la UI
        
        // Intento silencioso en el servidor (sin afectar la experiencia del usuario)
        this.apiService.deleteExperiencia(exp.historial_id).subscribe({
          next: () => {
            console.log('Experiencia eliminada exitosamente del servidor');
          },
          error: (err) => {
            // Log del error para debug, pero no afectamos la UI
            console.error('Error al eliminar del servidor:', err);
            
          
          }
        });
      }
    }

  }
    
  agregarExperiencia() {
    if (!this.esMiPerfil) return;
    
    const nueva: ExperienciaLaboral = {
      titulo: '',
      empresa: '',
      titulo_proyecto: '',
      inicio: '',
      fin: '',
      descripcion: '',
      esNueva: true,
      esPuestoActual: false,
      capability_id: undefined
    };
    
    this.experiencias.unshift(nueva);
    this.editandoIndice = 0;
    this.errores[this.editandoIndice] = { fechaInvalida: false };
  }

  cancelarNuevaExperiencia(index: number) {
    if (!this.esMiPerfil) return;
    if (this.experiencias[index]?.esNueva) {
      this.experiencias.splice(index, 1);
    }
    this.editandoIndice = null;
    delete this.errores[index];
  }

  guardarTrayectoria() {
    if (!this.esMiPerfil) return;
    if (this.editandoTrayectoria && this.editandoIndice !== null) {
      alert('Primero guarda o cancela la experiencia que estás editando.');
      return;
    }
    this.editandoTrayectoria = !this.editandoTrayectoria;
  }

  existeExperienciaNueva(): boolean {
    return this.experiencias.some(exp => exp.esNueva);
  }

  cerrarModalContrasena() {
    this.mostrarModalContrasena = false;
    this.contrasenaActual = '';
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';
    this.erroresPass = { actual: false, nueva: false, confirmar: false, mensajeError: "" };
  }

  confirmarCambioContrasena() {
    if (!this.esMiPerfil) return;

    const actualTrim = this.contrasenaActual.trim();
    const nuevaTrim = this.nuevaContrasena.trim();
    const confirmarTrim = this.confirmarContrasena.trim();

    this.erroresPass.actual = !actualTrim;
    this.erroresPass.nueva = !nuevaTrim || nuevaTrim.length < 8;
    this.erroresPass.confirmar = !confirmarTrim || nuevaTrim !== confirmarTrim;

    if (this.erroresPass.actual || this.erroresPass.nueva || this.erroresPass.confirmar) {
      return;
    }

    if (!this.empleadoId) return;

    this.apiService.validarContrasena(this.empleadoId, actualTrim, this.info.correo).subscribe({
      next: (res) => {
        if (!res.success) {
          this.erroresPass.actual = true;
          this.erroresPass.mensajeError = res.error;
          return;
        }

        this.apiService.cambiarContrasena(this.empleadoId!, nuevaTrim).subscribe({
          next: () => {
            this.cerrarModalContrasena();
          },
          error: (err) => {
            console.error('Error al cambiar la contraseña:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error al validar contraseña actual:', err);
      }
    });
  }

  validarFechas(index: number): boolean {
    const exp = this.experiencias[index];
    
    if (exp.esPuestoActual) {
      this.errores[index].fechaInvalida = false;
      return false;
    }
    
    if (!exp.inicio || !exp.fin) {
      return false;
    }
    
    const fechaInicio = new Date(exp.inicio);
    const fechaFin = new Date(exp.fin);
    
    const fechaInvalida = fechaFin < fechaInicio;
    this.errores[index].fechaInvalida = fechaInvalida;
    
    return fechaInvalida;
  }

  irARegistroHabilidades() {
    if (!this.esMiPerfil) return;
    if (this.empleadoId) {
      this.router.navigate(['/registro-habilidades', this.empleadoId]);
    }
  }

  guardarCambios(): void {
    let cambios = false;
    const usuarioTrim = this.nuevoUsuario?.trim() || '';

    this.erroresInfo.usuario = !usuarioTrim;

    if (this.erroresInfo.usuario) {
      return;
    }

    console.log(this.nuevaCiudad);

    // Solo enviar los campos que cambiaron
    let datosActualizados: any = {};
    datosActualizados.usuario = this.info.usuario;
    datosActualizados.estado_laboral = this.info.estado_laboral;
    datosActualizados.ciudad_id = 0;

    //Cambiar si hubo cambios
    if (usuarioTrim !== this.info.usuario) {
      datosActualizados.usuario = usuarioTrim;
      cambios = true;
    }
    if (this.nuevoEstado !== this.info.estado_laboral) {
      datosActualizados.estado_laboral = this.nuevoEstado;
      cambios = true;
    }
    if(this.nuevaCiudad.nombre !== this.info.ubicacion){
      datosActualizados.ciudad_id = this.nuevaCiudad.id;
      cambios = true;
    }

    console.log(datosActualizados);

    if (!this.empleadoId || cambios == false) {
      this.editandoInfo = false;
      return;
    }


    this.apiService.updateEmpleadoInfo(this.empleadoId, datosActualizados).subscribe({
      next: (res) => {
        if (res.success) {
          if (datosActualizados.usuario) this.info.usuario = datosActualizados.usuario;
          if (datosActualizados.estado_laboral) {
            this.info.estado_laboral = datosActualizados.estado_laboral;
            this.nuevoEstado = datosActualizados.estado_laboral;
          }
          this.editandoInfo = false;
        } else {
          // Mostrar mensaje de error del backend
          alert(res.error || 'Error al actualizar la información');
        }
      },
      error: (err) => {
        // Si el backend responde con error, mostrar el mensaje
        if (err.error && err.error.error) {
          alert(err.error.error);
        } else {
          alert('Error al actualizar info básica');
        }
        console.error('Error al actualizar info básica:', err);
      }
    });
  }


  obtenerCurso(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!this.empleadoId) {
      resolve();
      return;
    }

    this.apiService.obtenerCursosEmpleado(this.empleadoId).subscribe({
      next: (res) => {
        if (res.success) {
          console.log('Respuesta completa de cursos:', res);
          this.cursos = res.data;
        } else {
          console.error('Error al cargar cursos:', res.error);
        }
        resolve(); // se resuelve sin importar si hay error lógico
      },
      error: (err) => {
        console.error('Error al obtener cursos:', err);
        resolve(); // también se resuelve aunque haya error técnico
      }
    });
    this.crearGraficaPie2(this.progresoPromedio, 100 - this.progresoPromedio);
  });
  
}

  get progresoPromedio(): number {
  if (!this.cursos || this.cursos.length === 0) return 0;

  const total = this.cursos.reduce((sum, curso) => sum + Number(curso.progreso), 0);
  return total / this.cursos.length;
  }

  get cantidadCursosObligatorios(): number {
    return this.cursos.filter(curso => curso.obligatorio).length;
  }

  get cantidadCursosNoObligatorios(): number {
    return this.cursos.filter(curso => !curso.obligatorio).length;
  }

  obtenerNombresCursos(): string[] {
  return this.cursos.map(curso => curso.nombre);
  }

  obtenerProgresoCursos(): number[] {
    return this.cursos.map(curso => Number(curso.progreso));
  }


  async crearGraficaPie(cantidadObligatorios: number, cantidadNoObligatorios: number): Promise<void> {
  const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
  if (!canvas) {
    console.error('No se encontró el canvas con id pieChart');
    return;
  }

  if (this.pieChart) {
    this.pieChart.data.datasets[0].data = [cantidadObligatorios, cantidadNoObligatorios];
    this.pieChart.update();
  } else {
    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Obligatorios', 'No Obligatorios'],
        datasets: [{
          data: [cantidadObligatorios, cantidadNoObligatorios],
          backgroundColor: ['#9668e6', '#818181']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Cursos Obligatorios y No Obligatorios',
            color: '#0000000',
            font: { size: 20 }
          }
        }
      }
    });
  }
}

async crearGraficaPie2(progresoPromedio: number , percent: number): Promise<void> {
  const canvas = document.getElementById('pieChart2') as HTMLCanvasElement;
  if (!canvas) {
    console.error('No se encontró el canvas con id pieChart2');
    return;
  }

  if (this.pieChart2) {
    this.pieChart2.data.datasets[0].data = [progresoPromedio, percent];
    this.pieChart2.update();
  } else {
    this.pieChart2 = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Completado', 'No Completado'],
        datasets: [{
          data: [progresoPromedio, percent],
          backgroundColor: ['#9668e6', '#818181']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Progreso Promedio de Cursos',
            color: '#0000000',
            font: { size: 20 }
          }
        }
      }
    });
  }
}

  async crearGraficaBarra(obtenerProgresoCursos: Array<number>): Promise<void> {
  const canvas = document.getElementById('barChart') as HTMLCanvasElement;
  if (!canvas) {
    console.error('No se encontró el canvas con id barChart');
    return;
  }

  const etiquetas = this.obtenerNombresCursos();

  if (this.barChart) {
    this.barChart.data.labels = etiquetas;
    this.barChart.data.datasets[0].data = obtenerProgresoCursos;
    this.barChart.update();
  } else {
    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Cursos',
          data: obtenerProgresoCursos,
          backgroundColor: ['#9668e6', '#818181']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Progreso de Cursos (%)',
            color: '#0000000',
            font: { size: 20 },
            
          }
        }
      }
    });
  }
}

  async renderizarGraficas() {
  // Clear any existing charts first
  const canvases = ["pieChart", "pieChart2", "barChart"]
  canvases.forEach((id) => {
    const canvas = document.getElementById(id) as HTMLCanvasElement
    if (canvas) {
      const context = canvas.getContext("2d")
      if (context) context.clearRect(0, 0, canvas.width, canvas.height)
    }
  })

  // Render only the active chart
  if (this.activeChart === "pie1") {
    await this.crearGraficaPie(this.cantidadCursosObligatorios, this.cantidadCursosNoObligatorios)
  } else if (this.activeChart === "pie2") {
    await this.crearGraficaPie2(this.progresoPromedio, 100 - this.progresoPromedio)
  } else if (this.activeChart === "bar") {
    await this.crearGraficaBarra(this.obtenerProgresoCursos())
  }
  }

  // Add this method to switch between charts
changeActiveChart(chartType: string) {
  this.activeChart = chartType
  this.renderizarGraficas()
}

  cancelarEdicion(tipo: number): void {
    if(tipo == 1){ // edicion de informaciuon personal
      // Restablecer los valores originales
      this.nuevoEstado = this.info.estado_laboral;
      this.editandoInfo = false; // Salir del modo edición
    }


    // edicion de trayectoria
    if(tipo == 2){
      this.editandoTrayectoria = false;
    }
  }
}