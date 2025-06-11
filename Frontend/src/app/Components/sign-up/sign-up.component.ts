import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';

interface PeopleLead {
  empleado_id: string;
  rol: string;
  nombre_completo: string;
};

interface Capability {
  id: string;
  nombre: string;
};
 
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})

export class SignUpComponent {
  @ViewChild('toast') toast!: ElementRef;

  username = '';
  password = '';
  password2 = '';
  mensaje = '';
  email = '';
  name = '';
  patlastname = '';
  matlastname = '';
  peopleLead: PeopleLead[] = [];
  selectedPeopleLead: PeopleLead | null = null;
  capabilities: Capability[] = [];
  selectedCapability: Capability | null = null;
  rol: string[] = [];

  constructor(private auth: AuthService, private router: Router, private api: ApiService) {}
  
  ngOnInit(){
    this.getLeads();
    this.getCapabilities();
  }
 
  removeSpaces(email: string): string {
    return email.replace(/\s+/g, '');
  }

  showToast(message: string, isError: boolean = false): void {
    const toast = this.toast.nativeElement;
    toast.textContent = message;

    toast.classList.remove('success-toast', 'error-toast');

    if (isError) {
      toast.classList.add('error-toast');
    } else {
      toast.classList.add('success-toast');
    }

    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  signup(): void {
    this.email = this.removeSpaces(this.email); 
    if (!this.name || !this.patlastname || !this.password || !this.email) {
      this.showToast('Debes llenar los campos obligatorios.', true);
      return;
    } else if (this.password.length < 8) {
      this.showToast('La contraseña debe tener al menos 8 caracteres.', true);
      return;
    } else if(this.password !== this.password2){
      this.showToast('Las contraseñas no coinciden', true);
      return;
    }

    this.api.signup(this.name, this.patlastname, this.matlastname, this.email, this.password).subscribe({
      next: (response: any) => {
        console.log(response)
        if(response.success){
          this.showToast('Se envió un correo para verificar tu cuenta');
          // Opcional: limpiar el formulario después de éxito
          this.name = '';
          this.patlastname = '';
          this.matlastname = '';
          this.email = '';
          this.password = '';
          this.password2 = '';
        }else{
          if (response.error.includes('Invalid email') || response.error.includes('invalid email') || response.error.includes('Unable to validate email address: invalid format')) {
            this.showToast('Correo electrónico inválido', true);
          } else if (response.error.includes('Email already exists') || response.error.includes('already registered')) {
            this.showToast('Este correo electrónico ya está registrado', true);
          } else {
            this.showToast(response.error, true);
          }
          console.log(this.mensaje);
        }
      }, error: (err) => {
        if (err.error?.error?.includes('Invalid email') || err.error?.error?.includes('invalid email') || err.error?.error?.includes('Unable to validate email address: invalid format')) {
          this.showToast('Correo electrónico inválido', true);
        } else if (err.error?.error?.includes('Email already exists') || err.error?.error?.includes('already registered')) {
          this.showToast('Este correo electrónico ya está registrado', true);
        } else {
          this.showToast(err.error?.error || 'Hubo un error al intentar crear la cuenta', true);
        }
        console.log(this.mensaje);
      }
    });
  }

  getLeads() {
    this.api.getLeads().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.peopleLead = res.data;
        } else {
          console.error('Error al cargar leads:', res.error);
        }
      },
      error: (err: any) => {
        console.error('Error al obtener leads:', err);
      }
    });
  };

  getCapabilities() {
    this.api.getCapabilities().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.capabilities = res.data;
        } else {
          console.error('Error al cargar capabilities:', res.error);
        }
      },
      error: (err: any) => {
        console.error('Error al obtener capabilities:', err);
      }
    });
  }

}
