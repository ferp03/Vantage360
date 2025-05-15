import { Component, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-menucurycert',
  templateUrl: './menucurycert.component.html',
  styleUrls: ['./menucurycert.component.css']
})
export class MenucurycertComponent {
  @ViewChild('archivoInput') archivoInput!: ElementRef;
  
  certificado = {
    nombre: '',
    institucion: '',
    fecha: '',
    fechaVencimiento: '',
    archivo: null as File | null
  };
  
  guardandoCertificado: boolean = false;
  nombreArchivo: string = '';
  archivoInvalido: boolean = false;
  mostrarModalCertificado: boolean = false;
  formSubmitted: boolean = false;
  nombreDuplicadoError: string = '';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  abrirModalSubirCertificado(): void {
    this.mostrarModalCertificado = true;
    this.formSubmitted = false;
    this.nombreDuplicadoError = '';
    this.certificado = {
      nombre: '',
      institucion: '',
      fecha: '',
      fechaVencimiento: '', 
      archivo: null
    };
    this.nombreArchivo = '';
    this.archivoInvalido = false;
  }

  cerrarModalSubirCertificado(): void {
    this.mostrarModalCertificado = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const tiposPermitidos = ['.pdf', '.jpg', '.png', 'application/pdf', 'image/jpeg', 'image/png'];
      const esFormatoValido = tiposPermitidos.some(tipo => 
        file.type.includes(tipo) || file.name.toLowerCase().endsWith(tipo)
      );
      
      if (esFormatoValido) {
        this.nombreArchivo = file.name;
        this.certificado.archivo = file;
        this.archivoInvalido = false;
      } else {
        this.nombreArchivo = file.name;
        this.certificado.archivo = null;
        this.archivoInvalido = true;
      }
    } else {
      this.nombreArchivo = '';
      this.certificado.archivo = null;
      this.archivoInvalido = true;
    }
  }

  subirCertificado(form: NgForm) {
    this.formSubmitted = true;
    this.nombreDuplicadoError = '';

    if (!this.certificado.archivo) {
      this.archivoInvalido = true;
    }

    if (form.valid && !this.archivoInvalido && this.certificado.archivo) {
      this.guardandoCertificado = true;

      const formData = new FormData();
      formData.append('nombre', this.certificado.nombre);
      formData.append('institucion', this.certificado.institucion);
      formData.append('fecha_emision', this.certificado.fecha);
      formData.append('fecha_vencimiento', this.certificado.fechaVencimiento);
      formData.append('archivo', this.certificado.archivo);

      const empleadoId = this.authService.userId;

      if (!empleadoId) {
        console.error('No se pudo obtener el ID del empleado');
        return;
      }

      formData.append('empleado_id', empleadoId);

      this.apiService.guardarCertificado(formData).subscribe({
        next: (response) => {
          this.guardandoCertificado = false;
          console.log('Certificado subido exitosamente', response);
          this.cerrarModalSubirCertificado();
          // Aquí podrías recargar la lista de certificados si es necesario
        },
        error: (error) => {
          this.guardandoCertificado = false;

          if (error.status === 409) {
            this.nombreDuplicadoError = 'Ya existe un certificado con ese nombre.';
          } else {
            console.error('Error al subir certificado', error);
            this.nombreDuplicadoError = 'Ocurrió un error inesperado al subir el certificado.';
          }
        }
      });
    } else {
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsDirty();
        control.markAsTouched();
      });
    }
  }
}
