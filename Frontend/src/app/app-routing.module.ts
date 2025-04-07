import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { AboutComponent } from './Components/about/about.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './auth/auth.guard';
import { ContactComponent } from './Components/contact/contact.component';
import { ForgotPasswordComponent } from './Components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Components/reset-password/reset-password.component';
import { EmpleadoDetallesComponent } from './Components/empleado-detalles/empleado-detalles.component';
import { CursosComponent } from './Components/cursos/cursos.component';
import { CertificacionesComponent } from './Components/certificaciones/certificaciones.component';
import { SubirCertificadoComponent } from './Components/subir-certificado/subir-certificado.component';
import { RegistroHabilidadesComponent } from './Components/registro-habilidades/registro-habilidades.component';
import { DisponibilidadComponent } from './Components/disponibilidad/disponibilidad.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: 'empleados', component: DisponibilidadComponent, canActivate: [AuthGuard] },
      { path: 'registro-habilidades', component: RegistroHabilidadesComponent, canActivate: [AuthGuard] },
      { path: 'miscursos', component: CursosComponent, canActivate: [AuthGuard] },
      { path: 'certificates', component: CertificacionesComponent, canActivate: [AuthGuard]},
      { path: 'register-certificate', component: SubirCertificadoComponent, canActivate: [AuthGuard] },
      { path: 'empleado-detalles/:id', component: EmpleadoDetallesComponent, canActivate: [AuthGuard]}
    ]
  },

  // Ruta catch-all (opcional)
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }