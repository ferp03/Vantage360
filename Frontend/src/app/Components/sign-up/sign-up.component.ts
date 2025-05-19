import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';

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
  rol: string[] = [];

  constructor(private auth: AuthService, private router: Router, private api: ApiService) {}
  
 
  removeSpaces(email: string): string {
    return email.replace(/\s+/g, '');
  }

    signup(): void {
    this.email = this.removeSpaces(this.email); // Eliminar espacios del correo
    if (!this.name || !this.patlastname || !this.password || !this.email) {
      this.mensaje = 'Debes llenar los campos obligatorios.';
      return;
    }else if(this.password !== this.password2){
      this.mensaje = 'Las contraseñas no coinciden';
      return;
    }

    this.api.signup(this.name, this.patlastname, this.matlastname, this.email, this.password).subscribe({
      next: (response: any) => {
        console.log(response)
        if(response.success){
          this.mensaje = 'Se mandó un correo para verificar tu cuenta'
        }else{
          this.mensaje = response.error;
          console.log(this.mensaje);
        }
      }, error: (err) => {
        this.mensaje = err.error?.error || 'Hubo un error al intentar al crear la cuenta';
        console.log(this.mensaje);
      }
    });
  }
}
