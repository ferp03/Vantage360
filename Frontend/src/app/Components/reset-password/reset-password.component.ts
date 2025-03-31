import { Component, OnInit } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../../services/supabase'

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit{
  password: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';
  supabase: SupabaseClient;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.supabase = Supabase;
  }

  async ngOnInit() {
    const access_token = this.route.snapshot.queryParamMap.get('access_token');

    if (access_token) {
      const { error } = await this.supabase.auth.setSession({
        access_token,
        refresh_token: '' // Supabase permite vacío para reset
      });

      if (error) {
        this.mensajeError = 'Error al procesar el token.';
      }

      // Limpia la URL visualmente (opcional)
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      this.mensajeError = 'No se encontró el token de recuperación en la URL.';
    }
  }

  async cambiarContrasena() {
    const { error } = await this.supabase.auth.updateUser({
      password: this.password
    });

    if (error) {
      this.mensajeError = '';
      this.mensajeError = 'Error al cambiar contraseña: ' + error.message;
    } else {
      this.mensajeExito = 'Contraseña actualizada. Redirigiendo...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }
}
