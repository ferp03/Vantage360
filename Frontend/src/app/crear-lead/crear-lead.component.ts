import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/envs/environment';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-crear-lead',
  templateUrl: './crear-lead.component.html',
  styleUrls: ['./crear-lead.component.css']
})
export class CrearLeadComponent implements OnInit {
  name: string = '';
  patlastname: string = '';
  matlastname: string = '';
  email: string = '';
  password: string = '';
  password2: string = '';
  selectedLeadType: string = 'people_lead'; // Valor por defecto
  selectedPeopleLead: number | null = null;
  availableLeads: any[] = [];
  mensaje: string = '';
  mensajeError: boolean = false;
  isLoading: boolean = false;
  isLoadingLeads: boolean = false;

  @ViewChild('toast') toast!: ElementRef;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private api: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getLeads();
  }

  getLeads() {
    this.isLoadingLeads = true;
    this.api.getLeads().subscribe({
      next: (res: any) => {
        this.isLoadingLeads = false;
        if (res.success) {
          this.availableLeads = res.data;
        } else {
          console.error('Error al cargar leads:', res.error);
          this.mostrarMensaje('Error al cargar los leads disponibles', true);
        }
      },
      error: (err: any) => {
        this.isLoadingLeads = false;
        console.error('Error al obtener leads:', err);
        this.mostrarMensaje('Error de conexión al cargar leads', true);
      }
    });
  }

  private showToast(message: string, isError: boolean = false): void {
    const toast = this.toast.nativeElement;
    toast.textContent = message;

    // Reset classes
    toast.classList.remove('success-toast', 'error-toast');

    // Add appropriate class
    if (isError) {
      toast.classList.add('error-toast');
    } else {
      toast.classList.add('success-toast');
    }

    // Show toast
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  crearLead(): void {
    // Validaciones básicas
    if (!this.validarFormulario()) return;

    this.isLoading = true;
    const token = localStorage.getItem('token');
    const rol_id = this.selectedLeadType === 'people_lead' ? 2 : 1;

    const leadData = {
      name: this.name,
      patlastname: this.patlastname,
      matlastname: this.matlastname,
      email: this.email,
      password: this.password,
      rol: rol_id,
      lead_asignado_id: this.selectedPeopleLead
    };

    this.http.post(`${environment.apiUrl}/signup`, leadData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.showToast(`${this.selectedLeadType === 'people_lead' ? 'People Lead' : 'Delivery Lead'} creado exitosamente`);
          this.resetForm();
        } else {
          this.showToast(response.error || 'Error al crear lead', true);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast(error.error?.error || 'Error en el servidor', true);
        console.error('Error en la creación:', error);
      }
    });
  }

  private validarFormulario(): boolean {
    if (!this.name || !this.patlastname || !this.email || !this.password || !this.password2) {
      this.mostrarMensaje('Todos los campos marcados con * son obligatorios', true);
      return false;
    }

    if (this.password !== this.password2) {
      this.mostrarMensaje('Las contraseñas no coinciden', true);
      return false;
    }

    if (!this.selectedPeopleLead) {
      this.mostrarMensaje('Debes asignar un Lead', true);
      return false;
    }

    return true;
  }

  private mostrarMensaje(mensaje: string, esError: boolean = false): void {
    this.mensaje = mensaje;
    this.mensajeError = esError;
    setTimeout(() => this.mensaje = '', 5000);
  }

  resetForm(): void {
    this.name = '';
    this.patlastname = '';
    this.matlastname = '';
    this.email = '';
    this.password = '';
    this.password2 = '';
    this.selectedLeadType = 'people_lead';
    this.selectedPeopleLead = null;
  }
}