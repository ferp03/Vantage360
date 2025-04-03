import { Component, OnInit } from '@angular/core';

interface ExperienciaLaboral {
  titulo: string;
  empresa: string;
  inicio: string;
  fin: string;
  descripcion: string;
  esNueva?: boolean;
}

interface ErroresExperiencia {
  titulo?: boolean;
  empresa?: boolean;
  inicio?: boolean;
  fin?: boolean;
  descripcion?: boolean;
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
    email: 'cameron@webdev.com',
    usuario: 'Monterrey, MX',
  };

  erroresInfo = {
    email: false,
    usuario: false,
    formatoEmail: false,
  };

  habilidades: string[] = [];
  cursos: Curso[] = [];

  editandoInfo = false;
  editandoTrayectoria = false;
  editandoIndice: number | null = null;
  errores: { [index: number]: ErroresExperiencia } = {};

  experiencias: ExperienciaLaboral[] = [
    {
      titulo: 'Desarrollador ITSM Path',
      empresa: 'V360 Software',
      inicio: '2022-01-01',
      fin: '2024-04-01',
      descripcion: 'Desarrollo de interfaces SPA con Angular.'
    },
    {
      titulo: 'Proyecto interno Accenture',
      empresa: 'Accenture',
      inicio: '2021-07-08',
      fin: '2022-12-31',
      descripcion: 'Desarrollo de interfaces para plataforma interna.'
    },
    {
      titulo: 'Proyecto interno Oracle',
      empresa: 'Oracle',
      inicio: '2020-03-01',
      fin: '2021-06-30',
      descripcion: 'Dashboards internos y migración de componentes.'
    }
  ];

  ngOnInit() {
    this.cargarHabilidades();
    this.cargarCursos();
  }

  cargarHabilidades() {
    this.habilidades = [
      'React',
      'Angular',
      'UI/UX',
      'TypeScript',
      'Figma',
      'Adobe'
    ];
  }

  cargarCursos() {
    this.cursos = [
      { nombre: 'Angular Avanzado', plataforma: 'Platzi' },
      { nombre: 'Código Limpio', plataforma: 'Udemy' }
    ];
  }

  toggleEditarInfo() {
    const emailTrim = this.info.email.trim();
    const usuarioTrim = this.info.usuario.trim();

    this.erroresInfo.email = !emailTrim;
    this.erroresInfo.usuario = !usuarioTrim;
    this.erroresInfo.formatoEmail = emailTrim ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim) : false;

    const tieneErrores =
      this.erroresInfo.email || this.erroresInfo.usuario || this.erroresInfo.formatoEmail;

    if (tieneErrores) return;

    this.editandoInfo = !this.editandoInfo;
  }

  toggleEditarTrayectoria(index: number) {
    if (!this.editandoTrayectoria) return;

    const exp = this.experiencias[index];

    if (this.editandoIndice === index) {
      if (!this.errores[index]) this.errores[index] = {};

      this.errores[index].titulo = !exp.titulo?.trim();
      this.errores[index].empresa = !exp.empresa?.trim();
      this.errores[index].inicio = !exp.inicio?.trim();
      this.errores[index].fin = !exp.fin?.trim();
      this.errores[index].descripcion = !exp.descripcion?.trim();

      const tieneErrores = Object.values(this.errores[index]).some(e => e);
      if (tieneErrores) return;

      delete exp.esNueva;
      this.editandoIndice = null;
    } else {
      this.editandoIndice = index;
      if (!this.errores[index]) this.errores[index] = {};
    }
  }

  agregarExperiencia() {
    const nueva: ExperienciaLaboral = {
      titulo: '',
      empresa: '',
      inicio: '',
      fin: '',
      descripcion: '',
      esNueva: true
    };
    this.experiencias.push(nueva);
    const index = this.experiencias.length - 1;
    this.editandoIndice = index;
    this.errores[index] = {};
  }

  cancelarNuevaExperiencia(index: number) {
    if (this.experiencias[index]?.esNueva) {
      this.experiencias.splice(index, 1);
    }
    this.editandoIndice = null;
    delete this.errores[index];
  }

  guardarTrayectoria() {
    if (this.editandoTrayectoria) {
      if (this.editandoIndice !== null) {
        alert('Primero guarda o cancela la experiencia que estás editando.');
        return;
      }
      this.editandoTrayectoria = false;
    } else {
      this.editandoTrayectoria = true;
    }
  }

  existeExperienciaNueva(): boolean {
    return this.experiencias.some(exp => exp.esNueva);
  }

  mostrarModalContrasena = false;
  contrasenaActual = '';
  nuevaContrasena = '';
  confirmarContrasena = '';

  erroresPass = {
    actual: false,
    nueva: false,
    confirmar: false,
  };

  cerrarModalContrasena() {
    this.mostrarModalContrasena = false;
    this.contrasenaActual = '';
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';
    this.erroresPass = { actual: false, nueva: false, confirmar: false };
  }

  confirmarCambioContrasena() {
    const nuevaTrim = this.nuevaContrasena.trim();
    const confirmarTrim = this.confirmarContrasena.trim();
  
    this.erroresPass.actual = !this.contrasenaActual.trim();
    this.erroresPass.nueva = !nuevaTrim || nuevaTrim.length < 8;
    this.erroresPass.confirmar =
      !confirmarTrim || nuevaTrim !== confirmarTrim;
  
    const tieneErrores =
      this.erroresPass.actual || this.erroresPass.nueva || this.erroresPass.confirmar;
  
    if (tieneErrores) return;
  
    alert('¡Contraseña actualizada exitosamente!');
    this.cerrarModalContrasena();
  }  
}
