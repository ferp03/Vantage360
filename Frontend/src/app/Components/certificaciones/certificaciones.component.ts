import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-certificaciones',
  templateUrl: './certificaciones.component.html',
  styleUrls: ['./certificaciones.component.css']
})
export class CertificacionesComponent implements OnInit {
  certificados: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarCertificados();
  }

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