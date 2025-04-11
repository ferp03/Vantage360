import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-subir-certificado',
  templateUrl: './subir-certificado.component.html',
  styleUrls: ['./subir-certificado.component.css']
})
export class SubirCertificadoComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() certificadoEnviado = new EventEmitter<any>();

  formularioCertificado!: FormGroup;
  nombreArchivoSeleccionado: string = '';
  estaEnviando: boolean = false;

  // Almacena mensajes de error que quieras mostrar
  erroresFormulario: Record<string, string> = {
    name: '',
    issueDate: '',
    file: '',
    expiryDate: '',
    institute: ''
  };

  constructor(private fb: FormBuilder) {
    this.formularioCertificado = this.fb.group({
      name: ['', [Validators.required]],
      issueDate: ['', [Validators.required]],
      expiryDate: [''],
      institute: [''],
      file: [null, Validators.required]
    });
  }

  alCambiarArchivo(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      // Acá podrías validar tipo, tamaño, etc.
      this.nombreArchivoSeleccionado = archivo.name;
      this.formularioCertificado.patchValue({ file: archivo });
    }
  }

  onSubmit(): void {
    if (this.formularioCertificado.invalid) {
      // Marca controles como tocados
      Object.values(this.formularioCertificado.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    this.estaEnviando = true;
    setTimeout(() => {
      // Simulación de envío
      this.certificadoEnviado.emit(this.formularioCertificado.value);
      this.estaEnviando = false;
      this.cerrarModal.emit();
    }, 1000);
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}