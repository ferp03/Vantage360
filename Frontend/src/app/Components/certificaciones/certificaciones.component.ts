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
  loading = true;
  error: string | null = null;
  empleado: '' = "";
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.error = 'Error al cargar certificados';
        this.loading = false;
      }
    });
  }

  eliminarCertificado(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este certificado?')) return;

    this.apiService.eliminarCertificado(id).subscribe({
      next: () => {
        this.certificados = this.certificados.filter(c => c.certificacion_id !== id);
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.error = 'No se pudo eliminar el certificado';
      }
    });
  }

  descargarCertificado(url: string): void {
    window.open(url, '_blank');
  }
}