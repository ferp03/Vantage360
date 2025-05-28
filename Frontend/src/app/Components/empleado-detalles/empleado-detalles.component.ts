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

interface SubtitlePluginOptions {
  text: string;
  color?: string;
  font?: string;
}

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
  habilidad_id?: number;
  habilidad_nombre?: string; 
  habilidad_nivel?: string;
}

interface Capability {
  id: number;
  nombre: string;
}
interface HabilidadOption {
  id: number;
  nombre: string;
  categoria?: string;
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
  habilidad?: boolean;
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

  habilidadesOptions: HabilidadOption[] = []; // Lista de habilidades disponibles
  nivelesHabilidad = [
    { value: 'Básico', display: 'Básico' },
    { value: 'Intermedio', display: 'Intermedio' },
    { value: 'Avanzado', display: 'Avanzado' }
  ];


  pieChart: Chart | null = null;
  pieChart2: Chart | null = null;
  barChart: Chart | null = null;

  erroresInfo = {
    correo: false,
    usuario: false,
    formatoEmail: false,
  };

  habilidadPendiente: Habilidad | null = null;
  mensajeCambioContrasena = '';
  mostrarMensajeCambioContrasena = false;
  mensajeDesvanecido: boolean = false;
  mensajeExito: string = '';
  mostrarMensajeExito: boolean = false;
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
    
    this.cargarCiudades().then(() => {
      this.cargarInfoBasica();
    });
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
    this.cargarOpcionesHabilidades();
  }

  cargarOpcionesHabilidades(): void {
    this.apiService.getHabilidades().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.habilidadesOptions = res.data.map((h: any) => ({
            id: h.habilidad_id || h.id,
            nombre: h.nombre,
            categoria: h.categoria
          }));
        }
      },
      error: (err) => console.error('Error al cargar habilidades:', err)
    });
  }

  onHabilidadSeleccionada(index: number): void {
  const exp = this.experiencias[index];
  if (exp.habilidad_id) {
    const habilidadSeleccionada = this.habilidadesOptions.find(h => h.id === exp.habilidad_id);
    exp.habilidad_nombre = habilidadSeleccionada?.nombre || '';
  } else {
    exp.habilidad_nombre = '';
    exp.habilidad_nivel = '';
  }
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
        const ciudadEncontrada = this.ciudades.find(c => c.nombre === this.info.ubicacion);
        this.nuevaCiudad = ciudadEncontrada || { id: '', nombre: this.info.ubicacion };

        }
      },
      error: (err) => console.error('Error al obtener info:', err)
    });
  }

  private cargarHabilidades(): void {
    if (!this.empleadoId) return;

    this.apiService.getEmpleadoHabilidades(this.empleadoId).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.habilidades = res.data.map((row: any) => ({
          id: Number(
                 row.habilidad_id ??
                 row.habilidad?.habilidad_id ??
                 row.id ??
                 null
               ),                     
          nombre:       row.nombre      ?? row.habilidad?.nombre      ?? '—',
          nivel:        row.nivel       ?? row.nivel_habilidad        ?? 'Sin nivel',
          descripcion:  row.descripcion ?? 'Sin descripción'
        }));
      },
      error: err => console.error('Error al obtener habilidades:', err)
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

  cargarCiudades(): Promise<void> {
  return new Promise<void>((resolve) => {
    this.apiService.getCiudades().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ciudades = res.data;
        } else {
          console.error('Error al cargar ciudades:', res.error);
        }
        resolve();
      },
      error: (err: any) => {
        console.error('Error al obtener ciudades:', err);
        resolve();
      }
    });
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

    // Validaciones
    const errores: ErroresExperiencia = {
      titulo: !exp.titulo?.trim(),
      titulo_proyecto: !exp.titulo_proyecto?.trim(),
      empresa: !exp.empresa?.trim(),
      inicio: !exp.inicio?.trim(),
      fin: !exp.esPuestoActual && !exp.fin?.trim(),
      descripcion: !exp.descripcion?.trim(),
      fechaInvalida: false,
      habilidad: exp.habilidad_id ? !exp.habilidad_nivel : false
    };

    this.validarFechas(index);
    this.errores[index] = errores;

    if (Object.values(errores).some(e => e)) {
      console.log('Errores de validación:', errores);
      return;
    }
  
    const payload: any = {
      titulo_puesto: exp.titulo,
      titulo_proyecto: exp.titulo_proyecto,
      empresa: exp.empresa,
      descripcion: exp.descripcion,
      fecha_inicio: exp.inicio,
      fecha_fin: exp.esPuestoActual ? null : exp.fin,
      es_puesto_actual: exp.esPuestoActual,
      capability_id: exp.capability_id
    };

    // Agregar campos de habilidad solo si existen
    if (exp.habilidad_id) {
      payload.habilidad_id = exp.habilidad_id;
      payload.habilidad_nivel = exp.habilidad_nivel;
    }

    console.log('Payload completo:', payload);
  
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
      capability_id: undefined,
      habilidad_id: undefined,
      habilidad_nombre: '', 
      habilidad_nivel: ''   
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

    if (actualTrim === nuevaTrim) {
    this.erroresPass.nueva = true;
    this.erroresPass.mensajeError = 'La nueva contraseña no puede ser igual a la actual.';
    return;
  }

    if (!this.empleadoId) return;

    this.apiService.validarContrasena(this.empleadoId, actualTrim, this.info.correo).subscribe({
      next: (res) => {
        if (!res.success) {
          this.erroresPass.actual = true;
          this.erroresPass.nueva = false;
          this.erroresPass.confirmar = false;
          this.erroresPass.mensajeError = res.error || 'La contraseña actual es incorrecta';
          return;
        }

        this.erroresPass.actual = false;
        this.erroresPass.mensajeError = '';

        this.apiService.cambiarContrasena(this.empleadoId!, nuevaTrim).subscribe({
          next: () => {

            // Mostrar mensaje de éxito
            this.mostrarMensajeExito = true;
            
            // Cerrar después de 2 segundos
            setTimeout(() => {
              this.cerrarModalContrasena();
              this.mostrarMensajeExito = false;
            }, 2000);

           /*
            this.cerrarModalContrasena();
            this.mostrarMensajeCambioContrasena = true;
            this.mensajeCambioContrasena = 'Contraseña actualizada exitosamente';

            setTimeout(() => {
              this.mensajeDesvanecido = true;
            }, 1000); 

            setTimeout(() => {
              this.mostrarMensajeCambioContrasena = false;
              this.mensajeDesvanecido = false;
            }, 3000);
            */
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
          this.mensajeExito='Información actualizada correctamente';
          this.mostrarMensajeExito=true;

          setTimeout(() => {
            this.mensajeDesvanecido = true;
          }, 1000); 
          setTimeout(() => {
            this.mostrarMensajeExito = false;
            this.mensajeDesvanecido = false;
          }, 3000); 
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

  obtenerFechasCursos(): string[] {
    return this.cursos.map(curso => curso.fecha_emision);
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

  async crearGraficaBarra(obtenerProgresoCursos: Array<number>, fechasCursos: Array<string>): Promise<void> {
  const canvas = document.getElementById('barChart') as HTMLCanvasElement;
  if (!canvas) {
    console.error('No se encontró el canvas con id barChart');
    return;
  }

  const etiquetasCompletas = this.obtenerNombresCursos();

  // Filtrar por los últimos 6 meses
  const hoy = new Date();
  const seisMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 6, hoy.getDate());

  const cursosFiltrados = fechasCursos
    .map((fechaStr, i) => ({
      indice: i,
      fecha: new Date(fechaStr)
    }))
    .filter(curso => curso.fecha >= seisMesesAtras)
    .slice(0, 5); // máximo 5 cursos

  // Extraer los datos filtrados
  const etiquetas = cursosFiltrados.map(c => etiquetasCompletas[c.indice]);
  const datos = cursosFiltrados.map(c => obtenerProgresoCursos[c.indice]);
  // Define the plugin
  const subtitlePlugin = {
  id: 'subtitle',  // Note: This is the key identifier
  afterDraw(chart: Chart, args: any, options: any) {
    if (!options?.text) return;

    const { ctx, chartArea: { top, left, right } } = chart;
    ctx.save();
    ctx.font = options.font || '14px Arial';
    ctx.fillStyle = options.color || 'gray';
    ctx.textAlign = 'center';
    ctx.fillText(options.text, (left + right) / 2.2, top - 3);
    ctx.restore();
  }
};

// Register the plugin
Chart.register(subtitlePlugin);

if (this.barChart) {
  this.barChart.data.labels = etiquetas;
  this.barChart.data.datasets[0].data = datos;
  this.barChart.update();
} else {
  this.barChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Cursos',
        data: datos,
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
          color: '#000000',
          font: { size: 20 }
        },
        subtitle: {
          text: '(Últimos 6 meses)',
          // You can also add font and color here if needed
          // font: '12px Arial',
          // color: '#666'
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
    await this.crearGraficaBarra(this.obtenerProgresoCursos(), this.obtenerFechasCursos())
  }
  }

  // Add this method to switch between charts
changeActiveChart(chartType: string) {
  this.activeChart = chartType
  this.renderizarGraficas()
}

  cancelarEdicion(tipo: number): void {
    if(tipo == 1){ 
      // Restablecer los valores originales
      this.nuevoUsuario = this.info.usuario;
      this.nuevoEstado = this.info.estado_laboral;
      const ciudadEncontrada = this.ciudades.find(c => c.nombre === this.info.ubicacion);
      this.nuevaCiudad = ciudadEncontrada || { id: '', nombre: this.info.ubicacion };
      this.editandoInfo = false; // Salir del modo edición
    }


    if (tipo == 2) { // edición de trayectoria
    if (this.editandoIndice !== null) {
      this.cancelarEdicionExperiencia(this.editandoIndice);
    }
    this.experiencias = this.experiencias.filter(exp => !exp.esNueva);
    
    this.editandoTrayectoria = false;
    this.editandoIndice = null;
    }
  }

  eliminarHabilidad(hab: Habilidad) {
  if (!this.empleadoId) return;
  if (hab.id == null) {                
    console.error('habilidad sin id');
    return;
  }

  if (!confirm(`¿Eliminar "${hab.nombre}"?`)) return;

  this.apiService
      .deleteEmpleadoHabilidad(this.empleadoId, hab.id)
      .subscribe({
        next: () =>
          (this.habilidades = this.habilidades.filter(h => h.id !== hab.id)),
        error: err => {
          console.error('Error al borrar', err);
          alert('No se pudo eliminar la habilidad');
        }
      });
}

  abrirModalEliminar(hab: Habilidad): void {
  this.habilidadPendiente = hab;
}

confirmarEliminarHabilidad(): void {
  const hab = this.habilidadPendiente;

  if (!this.empleadoId || hab?.id === undefined) {
    this.habilidadPendiente = null;
    this.habilidadSeleccionada = null;
    return;                   
  }

  this.apiService
      .deleteEmpleadoHabilidad(this.empleadoId, hab.id)
      .subscribe({
        next: () => {
          this.habilidades = this.habilidades.filter(h => h.id !== hab.id);
          this.habilidadPendiente = null;
          this.habilidadSeleccionada = null;
        },
        error: err => {
          console.error('Error al borrar', err);
          alert('No se pudo eliminar la habilidad');
          this.habilidadPendiente = null;
          this.habilidadSeleccionada = null;
        }
      });
}

  habilidadEditando: Habilidad | null = null;
  nivelSeleccionado: string = '';
  descripcionEditada: string = '';

  // Definir opciones de nivel
  nivelHabilidad = ['Básico', 'Intermedio', 'Avanzado'];

  // Método para abrir modal de edición de habilidad
  abrirModalEditar(hab: Habilidad): void {
    this.habilidadEditando = { ...hab };
    this.nivelSeleccionado = hab.nivel;
    this.descripcionEditada = hab.descripcion;
  }

  // Método para cancelar la edición
  cancelarEdicionHabilidad(): void {
    this.habilidadEditando = null;
    this.nivelSeleccionado = '';
    this.descripcionEditada = '';
  }

  guardarCambiosHabilidad(): void {
    if (!this.empleadoId || !this.habilidadEditando || this.habilidadEditando.id === undefined) {
      this.habilidadEditando = null;
      return;
    }

    const datos = {
      nivel: this.nivelSeleccionado,
      descripcion: this.descripcionEditada
    };

    this.apiService.updateEmpleadoHabilidad(this.empleadoId, this.habilidadEditando.id, datos)
      .subscribe({
        next: (res) => {
          if (res.success) {
            const index = this.habilidades.findIndex(h => h.id === this.habilidadEditando!.id);
            if (index !== -1) {
              this.habilidades[index].nivel = this.nivelSeleccionado;
              this.habilidades[index].descripcion = this.descripcionEditada;
            }
            
            this.mensajeExito = 'Habilidad actualizada correctamente';
            this.mostrarMensajeExito = true;
            
            setTimeout(() => {
              this.mensajeDesvanecido = true;
            }, 1000); 
            
            setTimeout(() => {
              this.mostrarMensajeExito = false;
              this.mensajeDesvanecido = false;
            }, 3000);
            
            this.habilidadEditando = null;
          } else {
            console.error('Error al actualizar habilidad:', res.error);
            alert('No se pudo actualizar la habilidad');
          }
        },
        error: (err) => {
          console.error('Error al actualizar habilidad:', err);
          this.habilidadEditando = null;
        }
      });
  }

habilidadSeleccionada: Habilidad | null = null;

abrirMenuHabilidad(habilidad: Habilidad): void {
  this.habilidadSeleccionada = habilidad;
}

editarHabilidad(habilidad: Habilidad): void {
  this.habilidadSeleccionada = null; 
  this.abrirModalEditar(habilidad); 
}
}

