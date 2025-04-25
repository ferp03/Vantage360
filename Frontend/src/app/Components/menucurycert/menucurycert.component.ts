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
  
  nombreArchivo: string = '';
  archivoInvalido: boolean = false;
  mostrarModalCertificado: boolean = false;
  formSubmitted: boolean = false;
  isLoading: boolean = false;

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
    // document.body.classList.remove('modal-abierto');
    // Limpiar el formulario
    // this.nombreArchivo = '';
    // this.certificado = {
    //  nombre: '',
    //  institucion: '',
    //  fecha: '',
    //  archivo: null
    // };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Valida que sea un formato aceptado
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
    
    if (!this.certificado.archivo) {
      this.archivoInvalido = true;
    }
    
    if (form.valid && !this.archivoInvalido && this.certificado.archivo) {
      this.isLoading = true;
      
      const formData = new FormData();
      formData.append('nombre', this.certificado.nombre);
      formData.append('institucion', this.certificado.institucion);
      formData.append('fecha_emision', this.certificado.fecha);
      formData.append('fecha_vencimiento', this.certificado.fechaVencimiento);
      formData.append('archivo', this.certificado.archivo);
      
      const empleadoId = this.authService.userId;
      
      if (!empleadoId) {
        console.error('No se pudo obtener el ID del empleado');
        this.isLoading = false;
        return;
      }
  
      formData.append('empleado_id', empleadoId);
      
      this.apiService.guardarCertificado(formData).subscribe({
        next: (response) => {
          console.log('Certificado subido exitosamente', response);
          this.isLoading = false;
          this.cerrarModalSubirCertificado();
          // Mostrar notificación de éxito
          alert('Certificado subido exitosamente!');
          // Puedes recargar la lista de certificados aquí si es necesario
        },
        error: (error) => {
          console.error('Error al subir certificado', error);
          this.isLoading = false;
          // Mostrar notificación de error
          alert(`Error al subir certificado: ${error.error?.error || error.message}`);
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