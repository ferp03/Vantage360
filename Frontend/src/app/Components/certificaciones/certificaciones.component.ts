import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-certificaciones',
  templateUrl: './certificaciones.component.html',
  styleUrls: ['./certificaciones.component.css']
})
export class CertificacionesComponent {
  mostrarModal: boolean = false;
  certificados: any[] = [];

  constructor(private apiService : ApiService) {};

  cargarCertificados(): void {
    this.apiService.obtenerCertificados().subscribe({
      next: (response) => {
        this.certificados = response.data;
      },
      error: (err) => {
        console.error('Error al cargar certificados:', err);
      }
    });
  }

  abrirModal(): void {
    this.mostrarModal = true;
  }

  onCerrarModal(): void {
    this.mostrarModal = false;
  }

  onCertificadoEnviado(formData: any): void {
    const payload = new FormData();
    
    payload.append('nombre_curso', formData.name);
    payload.append('institucion', formData.institution);
    payload.append('fecha_emision', formData.issueDate);
    payload.append('archivo', formData.file);
    
    if (formData.expiryDate) {
      payload.append('fecha_vencimiento', formData.expiryDate);
    }
    if (formData.certificateId) {
      payload.append('certificado_id', formData.certificateId);
    }

    this.apiService.guardarCertificado(payload).subscribe({
      next: (response) => {
        console.log('Certificado guardado:', response);
        this.mostrarModal = false;
        this.cargarCertificados();
      },
      error: (err) => {
        console.error('Error al guardar certificado:', err);
      }
    });
  }

  eliminarCertificado(id: string): void {
    if (confirm('¿Estás seguro de eliminar este certificado?')) {
      this.apiService.eliminarCertificado(id).subscribe({
        next: () => {
          this.cargarCertificados();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
        }
      });
    }
  }
}