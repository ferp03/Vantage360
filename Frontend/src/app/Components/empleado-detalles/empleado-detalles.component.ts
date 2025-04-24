import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';

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

interface ErroresExperiencia {
  titulo?: boolean;
  empresa?: boolean;
  titulo_proyecto?: boolean;
  inicio?: boolean;
  fin?: boolean;
  descripcion?: boolean;
  fechaInvalida?: boolean;
}

interface Curso {
  nombre: string;
  plataforma: string;
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
    cargabilidad: ''
  };

  erroresInfo = {
    correo: false,
    usuario: false,
    formatoEmail: false,
  };

  habilidades: string[] = [];
  cursos: Curso[] = [];
  experiencias: ExperienciaLaboral[] = [];
  capabilities: Capability[] = [];

  experienciasOriginales: { [key: number]: ExperienciaLaboral } = {};

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
  };

  private empleadoId: string | null = null;
  esMiPerfil: boolean = false; 

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.empleadoId = params.get('id');
      const idUsuarioLogueado = this.authService.userId;
      this.esMiPerfil = (idUsuarioLogueado == this.empleadoId);
  
      this.cargarInfoBasica();
      this.cargarHabilidades();
      this.cargarCursos();
      
      // Primero cargamos las capabilities, y después la trayectoria
      this.cargarCapabilities().then(() => {
        this.cargarTrayectoria();
      });
    });
  }

  cargarCapabilities(): Promise<void> {
    console.log('Intentando cargar capabilities...');
    return new Promise<void>((resolve) => {
      this.apiService.getCapabilities().subscribe({
        next: (res: any) => {
          console.log('Respuesta completa de capabilities:', res);
          if (res.success) {
            this.capabilities = res.data;
            console.log('Capabilities cargadas:', this.capabilities);
          } else {
            console.error('Error al cargar capabilities:', res.error);
          }
          resolve(); // Resolvemos la promesa sin importar si hubo éxito o error
        },
        error: (err: any) => {
          console.error('Error al obtener capabilities:', err);
          this.capabilities = [
            { id: 1, nombre: 'Agile' },
            { id: 2, nombre: 'Back End Engineering' },
            { id: 3, nombre: 'Business Analyst' },
            { id: 4, nombre: 'Capital Markets Processes' },
            { id: 5, nombre: 'Cloud' }
          ];
          console.log('Usando capabilities de prueba');
          resolve(); // Resolvemos la promesa con capabilities de respaldo
        }
      });
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
            cargabilidad: res.data.cargabilidad
          };
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
          this.habilidades = res.data;
        }
      },
      error: (err) => console.error('Error al obtener habilidades:', err)
    });
  }

  cargarCursos() {
    if (!this.empleadoId) return;
    this.apiService.getEmpleadoCertificaciones(this.empleadoId).subscribe({
      next: (res) => {
        if (res.success) {
          this.cursos = res.data;
        }
      },
      error: (err) => console.error('Error al obtener certificaciones:', err)
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

  toggleEditarInfo() {
    if (!this.esMiPerfil) return;

    const correoTrim = this.info.correo.trim();
    const usuarioTrim = this.info.usuario.trim();

    this.erroresInfo.correo = !correoTrim;
    this.erroresInfo.usuario = !usuarioTrim;
    this.erroresInfo.formatoEmail = correoTrim ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTrim) : false;

    if (this.erroresInfo.correo || this.erroresInfo.usuario || this.erroresInfo.formatoEmail) {
      return;
    }

    if (this.editandoInfo) {
      if (!this.empleadoId) return;
      this.apiService.updateEmpleadoInfo(this.empleadoId, {
        correo: this.info.correo,
        usuario: this.info.usuario
      }).subscribe({
        next: () => console.log('Info básica actualizada.'),
        error: (err) => console.error('Error actualizando info básica:', err)
      });
    }

    this.editandoInfo = !this.editandoInfo;
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
    
    if (exp.esNueva) {
      this.experiencias.splice(index, 1);
      this.editandoIndice = null;
      return;
    }
    if (exp.historial_id) {
      if (confirm('¿Estás seguro de que deseas eliminar esta experiencia laboral?')) {
        this.apiService.deleteExperiencia(exp.historial_id).subscribe({
          next: () => {
            console.log('Experiencia eliminada exitosamente');
            this.experiencias.splice(index, 1);
            this.editandoIndice = null;
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            console.error('Error al eliminar experiencia:', err);
            alert('Error al eliminar la experiencia. Por favor, intenta nuevamente.');
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
    this.erroresPass = { actual: false, nueva: false, confirmar: false };
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

    this.apiService.validarContrasena(this.empleadoId, actualTrim).subscribe({
      next: (res) => {
        if (!res.success) {
          this.erroresPass.actual = true;
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
}