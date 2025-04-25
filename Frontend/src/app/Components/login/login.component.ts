import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  //username = '';
  password = '';
  password2 = '';
  mensaje = '';
  email = '';
  name = '';
  patlastname = '';
  matlastname = '';
  isSignUp = false;
  isLogin = true;

  constructor(private auth: AuthService, private router: Router, private api: ApiService) {}

  //Funcion que elimina espacios de correo
  removeSpaces(email: string): string {
    return email.replace(/\s+/g, '');
  }


  login(): void {
    this.email = this.removeSpaces(this.email); // Eliminar espacios del correo
    this.auth.login(this.email, this.password).subscribe({
      next: (response: any) => {
        if (response.success) {
          if(this.auth.roles.includes('delivery lead') || this.auth.roles.includes('people lead')){
            this.router.navigate(['/empleados']);
          }else{
            this.router.navigate(['/miscursos']);
          }
        } else {
          this.mensaje = response.error;
          console.log(this.mensaje);
        }
      },
      error: (err) => {
        // Este bloque se activa si el backend devuelve 401 u otro error de red
        this.mensaje = err.error?.error || 'Ingresar correctamente el correo y contraseña';
        console.log(this.mensaje);
      }
    });
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
          this.isSignUp = false;
          this.isLogin = true;
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

  forgot(): void {
    this.router.navigate(['/forgot-password']);
  }
}
