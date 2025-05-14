import { Component, OnInit } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  password: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';
  cargando: boolean = true;
  sesionActiva: boolean = false;
  supabase: SupabaseClient;

  constructor(private router: Router) {
    this.supabase = Supabase;
  }

  async ngOnInit() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error || !data.session) {
      this.mensajeError = 'No tienes una sesión activa para cambiar la contraseña. Asegúrate de acceder desde el enlace del correo.';
      this.cargando = false;
      return;
    }

    this.sesionActiva = true;
    this.cargando = false;
  }

  async cambiarContrasena() {
    if (this.password.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    const { error } = await this.supabase.auth.updateUser({
      password: this.password
    });

    if (error) {
      this.mensajeError = 'Error al cambiar la contraseña: ' + error.message;
    } else {
      this.mensajeExito = 'Contraseña actualizada correctamente. Redirigiendo...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }
}
