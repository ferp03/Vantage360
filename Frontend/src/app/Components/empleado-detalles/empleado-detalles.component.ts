import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute, Router} from '@angular/router';

interface ExperienciaLaboral {
  historial_id?: number;
  titulo: string;
  empresa: string;
  titulo_proyecto: string;
  inicio: string;
  fin: string;
  descripcion: string;
  esNueva?: boolean;
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

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.empleadoId = this.route.snapshot.paramMap.get('id');
    this.cargarInfoBasica();
    this.cargarHabilidades();
    this.cargarCursos();
    this.cargarTrayectoria();
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
        }
      },
      error: (err) => console.error('Error al obtener trayectoria:', err)
    });
  }

  formatearFecha(fecha: string): string {
    const opciones = { year: 'numeric', month: 'long' } as const;
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', opciones);
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  }

  toggleEditarInfo() {
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

  toggleEditarTrayectoria(index: number) {
    if (!this.editandoTrayectoria) return;

    const exp = this.experiencias[index];
    this.errores[index] = {
      titulo: !exp.titulo?.trim(),
      titulo_proyecto: !exp.titulo_proyecto?.trim(),
      empresa: !exp.empresa?.trim(),
      inicio: !exp.inicio?.trim(),
      fin: !exp.fin?.trim(),
      descripcion: !exp.descripcion?.trim(),
      fechaInvalida: false
    };

    this.validarFechas(index);

    if (this.editandoIndice === index) {
      if (Object.values(this.errores[index]).some(e => e)) {
        return;
      }

      const payload = {
        titulo_puesto: exp.titulo,
        titulo_proyecto: exp.titulo_proyecto,
        empresa: exp.empresa,
        descripcion: exp.descripcion,
        fecha_inicio: exp.inicio,
        fecha_fin: exp.fin
      };

      if (exp.esNueva) {
        if (!this.empleadoId) return;

        this.apiService.createExperiencia(this.empleadoId, payload).subscribe({
          next: (res) => {
            console.log('Experiencia creada:', res);
            exp.historial_id = res.data?.historial_id;
            delete exp.esNueva;
          },
          error: (err) => {
            console.error('Error al crear experiencia:', err);
          }
        });
      } else if (exp.historial_id) {
        this.apiService.updateExperiencia(exp.historial_id, payload).subscribe({
          next: () => console.log('Experiencia actualizada.'),
          error: (err) => console.error('Error al actualizar experiencia:', err)
        });
      }

      this.editandoIndice = null;
    } else {
      this.editandoIndice = index;
      if (!this.errores[index]) {
        this.errores[index] = {};
      }
    }
  }

  agregarExperiencia() {
    const nueva: ExperienciaLaboral = {
      titulo: '',
      empresa: '',
      titulo_proyecto: '',
      inicio: '',
      fin: '',
      descripcion: '',
      esNueva: true
    };
    this.experiencias.push(nueva);
    this.editandoIndice = this.experiencias.length - 1;
    this.errores[this.editandoIndice] = {fechaInvalida: false};
  }

  cancelarNuevaExperiencia(index: number) {
    if (this.experiencias[index]?.esNueva) {
      this.experiencias.splice(index, 1);
    }
    this.editandoIndice = null;
    delete this.errores[index];
  }

  guardarTrayectoria() {
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
    
    if (!exp.inicio || !exp.fin) {
      return false; 
    }
    
    const fechaInicio = new Date(exp.inicio);
    const fechaFin = new Date(exp.fin);
    
    if (!this.errores[index].fechaInvalida) {
      this.errores[index].fechaInvalida = false;
    }
    
    const fechaInvalida = fechaFin < fechaInicio;
    this.errores[index].fechaInvalida = fechaInvalida;
    
    return fechaInvalida;
  }

  irARegistroHabilidades() {
    if (this.empleadoId) {
      this.router.navigate(['/registro-habilidades', this.empleadoId]);
    }
  }
}

