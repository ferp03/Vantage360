import { Component } from '@angular/core';

interface ExperienciaLaboral {
  titulo: string;
  empresa: string;
  inicio: string;
  fin: string;
  descripcion: string;
  esNueva?: boolean;
}

@Component({
  selector: 'app-empleado-detalles',
  templateUrl: './empleado-detalles.component.html',
  styleUrls: ['./empleado-detalles.component.css']
})
export class EmpleadoDetallesComponent {
  info = {
    email: 'cameron@webdev.com',
    ubicacion: 'Monterrey, MX',
    telefono: '+52 81 9999 1234'
  };

  erroresInfo = {
    email: false,
    ubicacion: false,
    telefono: false
  };

  editandoInfo = false;
  editandoTrayectoria = false; 
  editandoIndice: number | null = null;
  errores: { [index: number]: boolean } = {};

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

  toggleEditarInfo() {
    if (this.editandoInfo) {
      this.erroresInfo.email = !this.info.email.trim();
      this.erroresInfo.ubicacion = !this.info.ubicacion.trim();
      this.erroresInfo.telefono = !this.info.telefono.trim();

      const tieneErrores = this.erroresInfo.email || this.erroresInfo.ubicacion || this.erroresInfo.telefono;
      if (tieneErrores) return;

      this.editandoInfo = false;
    } else {
      this.editandoInfo = true;
    }
  }

  toggleEditarTrayectoria(index: number) {
    if (!this.editandoTrayectoria) return;

    const exp = this.experiencias[index];

    if (this.editandoIndice === index) {
      if (!exp.titulo || !exp.empresa || !exp.inicio || !exp.fin || !exp.descripcion) {
        this.errores[index] = true;
        return;
      }

      this.errores[index] = false;
      delete exp.esNueva;
      this.editandoIndice = null;
    } else {
      this.editandoIndice = index;
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
    this.editandoIndice = this.experiencias.length - 1;
  }

  cancelarNuevaExperiencia(index: number) {
    if (this.experiencias[index]?.esNueva) {
      this.experiencias.splice(index, 1);
    }
    this.editandoIndice = null;
    delete this.errores[index];
  }
}
