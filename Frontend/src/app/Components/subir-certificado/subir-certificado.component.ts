import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

type FormField = 'name' | 'issueDate' | 'file' | 'expiryDate' | 'certificateId';
type ErrorType = 'required' | 'maxlength' | 'pastDate' | 'invalidType';

@Component({
  selector: 'app-subir-certificado',
  templateUrl: './subir-certificado.component.html',
  styleUrls: ['./subir-certificado.component.css']
})
export class SubirCertificadoComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() certificadoEnviado = new EventEmitter<any>();

  formularioCertificado!: FormGroup; // certificateForm
  nombreArchivoSeleccionado: string = '';
  estaEnviando: boolean = false;
  erroresFormulario: Record<FormField, string> = {
    name: '',
    issueDate: '',
    file: '',
    expiryDate: '',
    certificateId: ''
  };

  mensajesError: Record<FormField, Partial<Record<ErrorType, string>>> = {
    name: {
      required: 'Este campo es requerido',
      maxlength: 'Máx. 100 caracteres'
    },
    issueDate: {
      required: 'Este campo es requerido',
      pastDate: 'La fecha no puede ser futura'
    },
    file: {
      required: 'Este campo es requerido',
      invalidType: 'Solo se aceptan PDF, JPG o PNG'
    },
    expiryDate: {
      required: 'Este campo es requerido',
      pastDate: 'La fecha no puede ser pasada'
    },
    certificateId: {
      required: 'Este campo es requerido'
    }
  };

  constructor(private fb: FormBuilder) {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.formularioCertificado = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      issueDate: ['', [Validators.required, this.validarFechaPasada]],
      expiryDate: ['', [Validators.required, this.validarFechaPasada]],
      certificateId: ['', [Validators.required]],
      file: [null, Validators.required]
    });

    this.formularioCertificado.valueChanges.subscribe(() => {
      this.actualizarErroresFormulario();
    });
  }

  validarFechaPasada(control: AbstractControl): { [key: string]: boolean } | null {
    const fechaSeleccionada = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada > hoy) {
      return { pastDate: true };
    }
    return null;
  }

  validarFechaFutura(control: AbstractControl): { [key: string]: boolean } | null {
    // Si el campo está vacío (y es opcional), no hay error
    if (!control.value) {
      return null;
    }
  
    const fechaVencimiento = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
  
    // Verificamos si la fecha de vencimiento es hoy o en el pasado
    if (fechaVencimiento <= hoy) {
      return { futureDateRequired: true }; // Error si no es futura
    }
  
    return null;
  }  

  alCambiarArchivo(event: any): void {
    const archivo = event.target.files[0];
    
    if (archivo) {
      const tiposValidos = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!tiposValidos.includes(archivo.type)) {
        this.erroresFormulario['file'] = this.mensajesError.file.invalidType!;
        this.formularioCertificado.get('file')?.setErrors({ invalidType: true });
        return;
      }

      this.nombreArchivoSeleccionado = archivo.name;
      this.formularioCertificado.patchValue({ file: archivo });
      this.formularioCertificado.get('file')?.updateValueAndValidity();
      this.erroresFormulario['file'] = '';
    }
  }

  actualizarErroresFormulario(): void {
    (Object.keys(this.formularioCertificado.controls) as FormField[]).forEach((campo: FormField) => {
      const control = this.formularioCertificado.get(campo);
      if (control?.errors && (control.dirty || control.touched)) {
        const primerError = Object.keys(control.errors)[0] as ErrorType;
        this.erroresFormulario[campo] = this.mensajesError[campo]?.[primerError] || 'Campo inválido';
      } else {
        this.erroresFormulario[campo] = '';
      }
    });
  }

  onSubmit(): void {
    if (this.formularioCertificado.invalid) {
      Object.values(this.formularioCertificado.controls).forEach(control => {
        control.markAsTouched();
      });
      this.actualizarErroresFormulario();
      return;
    }

    this.estaEnviando = true;
    
    setTimeout(() => {
      this.certificadoEnviado.emit(this.formularioCertificado.value);
      this.estaEnviando = false;
      this.cerrarModal.emit();
    }, 1000);
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}