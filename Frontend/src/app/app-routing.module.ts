import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './auth/auth.guard';
import { UserGuard } from './auth/user.guard';
import { AdminGuard } from './auth/admin.guard';
import { ForgotPasswordComponent } from './Components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Components/reset-password/reset-password.component';
import { EmpleadoDetallesComponent } from './Components/empleado-detalles/empleado-detalles.component';
import { CursosComponent } from './Components/cursos/cursos.component';
import { CertificacionesComponent } from './Components/certificaciones/certificaciones.component';
import { RegistroHabilidadesComponent } from './Components/registro-habilidades/registro-habilidades.component';
import { DisponibilidadComponent } from './Components/disponibilidad/disponibilidad.component';
import { MenucurycertComponent } from './Components/menucurycert/menucurycert.component';
import { ProyectosComponent } from './Components/proyectos/proyectos.component';
import { ParticipacionPComponent } from './Components/participacion-p/participacion-p.component';
import { SignUpComponent } from './Components/sign-up/sign-up.component';
import { RecomendacionesComponent } from './Components/recomendaciones/recomendaciones.component';
import { CrearLeadComponent } from './crear-lead/crear-lead.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'cursos_certificados', pathMatch: 'full' },
      { path: 'empleados', component: DisponibilidadComponent, canActivate: [UserGuard] },
      { path: 'crear-proyectos', component: ProyectosComponent, canActivate: [UserGuard] },
      { path: 'crear-cuenta', component: SignUpComponent, canActivate : [UserGuard] },
      { path: 'registro-habilidades', component: RegistroHabilidadesComponent, canActivate: [AuthGuard] },
      { path: 'miscursos', component: CursosComponent, canActivate: [AuthGuard] },
      { path: 'certificates', component: CertificacionesComponent, canActivate: [AuthGuard]},
      { path: 'empleado-detalles/:id', component: EmpleadoDetallesComponent, canActivate: [AuthGuard]},
      { path: 'registro-habilidades/:id', component: RegistroHabilidadesComponent, canActivate: [AuthGuard]},
      { path: 'cursos_certificados', component: MenucurycertComponent, canActivate: [AuthGuard] },
      { path: 'participacion_p',component: ParticipacionPComponent, canActivate: [AuthGuard] },
      { path: 'recomendaciones', component: RecomendacionesComponent, canActivate: [AuthGuard] },
      { path: 'crear-lead', component: CrearLeadComponent, canActivate: [AdminGuard] },
    ]
  },

  // Ruta catch-all (opcional)
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }