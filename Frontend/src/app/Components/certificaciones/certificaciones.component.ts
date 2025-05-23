import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from 'src/app/auth/auth.service';

interface Certificado {
  certificacion_id: number;
  nombre: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  institucion: string;
  archivo: string;
}

@Component({
  selector: 'app-certificaciones',
  templateUrl: './certificaciones.component.html',
  styleUrls: ['./certificaciones.component.css']
})
export class CertificacionesComponent implements OnInit {
  certificados: Certificado[] = [];
  certificadosPaginados: Certificado[] = [];
  certificadosPorPagina = 3;
  paginaActual = 1;
  totalPaginas = 1;
  loading = true;
  error: string | null = null;
  empleado = '';
  mostrarModalConfirmacion = false;
  eliminandoCertificado = false;
  certificacionIdAEliminar: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCertificados();
  }

  private cargarCertificados(): void {
    const empleado_id = this.authService.userId;

    if (!empleado_id) {
      this.error = 'No se pudo identificar al usuario';
      this.loading = false;
      return;
    }

    this.apiService.obtenerCertificadosPorEmpleado(empleado_id).subscribe({
      next: (response) => {
        this.certificados = response.data || [];
        this.totalPaginas = Math.ceil(this.certificados.length / this.certificadosPorPagina);
        this.actualizarPaginacion();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.error = 'Error al cargar certificados';
        this.loading = false;
      }
    });
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.certificadosPorPagina;
    const fin = inicio + this.certificadosPorPagina;
    this.certificadosPaginados = this.certificados.slice(inicio, fin);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  descargarCertificado(url: string): void {
    window.open(url, '_blank');
  }

  confirmarEliminarCertificado(certificacionId: number): void {
    this.certificacionIdAEliminar = certificacionId;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminar(): void {
    this.mostrarModalConfirmacion = false;
    this.certificacionIdAEliminar = null;
  }

  eliminarCertificado(): void {
    if (!this.certificacionIdAEliminar) return;
    
    this.eliminandoCertificado = true;
    
    this.apiService.eliminarCertificado(this.certificacionIdAEliminar).subscribe({
      next: () => {
        this.certificados = this.certificados.filter(
          c => c.certificacion_id !== this.certificacionIdAEliminar
        );
        this.totalPaginas = Math.ceil(this.certificados.length / this.certificadosPorPagina);
        
        if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
          this.paginaActual = this.totalPaginas;
        }
        
        this.actualizarPaginacion();
        this.mostrarModalConfirmacion = false;
        this.certificacionIdAEliminar = null;
        this.eliminandoCertificado = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.error = 'Error al eliminar certificado';
        this.eliminandoCertificado = false;
      }
    });
  }
}


