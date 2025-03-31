import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  mensaje = '';

  constructor(private router: Router, private api: ApiService) {}

  recover(): void {
    this.api.forgot_password(this.email)
    .subscribe({
      next: res => this.mensaje = res.message,
      error: err => this.mensaje = err.error?.error || 'Error inesperado'
    });
    alert('Se ha enviado un correo para recuperar la contraseña');
    this.gotoLogin()
  }


  gotoLogin(): void {
    this.router.navigate(['/login']);
  }
}
