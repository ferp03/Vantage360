import { Component, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

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
    archivo: null
  };
  
  nombreArchivo: string = '';
  archivoInvalido: boolean = false;
  mostrarModalCertificado: boolean = false;
  formSubmitted: boolean = false;

  constructor(private router: Router) { }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  abrirModalSubirCertificado(): void {
    this.mostrarModalCertificado = true;
    this.formSubmitted = false;
    // Reiniciar el formulario
    this.certificado = {
      nombre: '',
      institucion: '',
      fecha: '',
      archivo: null
    };
    this.nombreArchivo = '';
    this.archivoInvalido = false;
    // document.body.classList.add('modal-abierto');
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
    // Verifica si hay archivo seleccionado
    if (!this.certificado.archivo) {
      this.archivoInvalido = true;
    }
    
    if (form.valid && !this.archivoInvalido) {
      // Aquí va tu lógica para subir el certificado
      console.log('Subiendo certificado', this.certificado);
      
      // Cerrar modal después de subir
      this.cerrarModalSubirCertificado();
    } else {
      // Marca todos los campos como touched para mostrar errores
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsDirty();
        control.markAsTouched();
      });
    }
  }
}