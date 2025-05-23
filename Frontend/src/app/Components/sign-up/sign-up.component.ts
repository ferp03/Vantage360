import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';

interface PeopleLead {
  empleado_id: string;
  rol: string;
  nombre_completo: string;
};
 
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})

export class SignUpComponent {
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
  rol: string[] = [];

  constructor(private auth: AuthService, private router: Router, private api: ApiService) {}
  
  ngOnInit(){
    this.getLeads();
  }
 
  removeSpaces(email: string): string {
    return email.replace(/\s+/g, '');
  }

  signup(): void {
  this.email = this.removeSpaces(this.email); 
  if (!this.name || !this.patlastname || !this.password || !this.email) {
    this.mensaje = 'Debes llenar los campos obligatorios.';
    return;
  } else if (this.password.length < 8) {
    this.mensaje = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  } else if(this.password !== this.password2){
    this.mensaje = 'Las contraseñas no coinciden';
    return;
  }

  this.api.signup(this.name, this.patlastname, this.matlastname, this.email, this.password).subscribe({
    next: (response: any) => {
      console.log(response)
      if(response.success){
        this.mensaje = 'Se mandó un correo para verificar la cuenta'
      }else{
        if (response.error.includes('Invalid email') || response.error.includes('invalid email') || response.error.includes('Unable to validate email address: invalid format')) {
          this.mensaje = 'Correo electrónico inválido';
        } else if (response.error.includes('Email already exists') || response.error.includes('already registered')) {
          this.mensaje = 'Este correo electrónico ya está registrado';
        } else {
          this.mensaje = response.error;
        }
        console.log(this.mensaje);
      }
    }, error: (err) => {
      if (err.error?.error?.includes('Invalid email') || err.error?.error?.includes('invalid email') || err.error?.error?.includes('Unable to validate email address: invalid format')) {
        this.mensaje = 'Correo electrónico inválido';
      } else if (err.error?.error?.includes('Email already exists') || err.error?.error?.includes('already registered')) {
        this.mensaje = 'Este correo electrónico ya está registrado';
      } else {
        this.mensaje = err.error?.error || 'Hubo un error al intentar crear la cuenta';
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
}
