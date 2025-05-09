import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './Components/login/login.component';
import { AppComponent } from './app.component';
import { MenuBarComponent } from './Components/menu-bar/menu-bar.component';
import { LayoutComponent } from './layout/layout.component';
import { ForgotPasswordComponent } from './Components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Components/reset-password/reset-password.component';
import { EmpleadoDetallesComponent } from './Components/empleado-detalles/empleado-detalles.component';
import { CursosComponent } from './Components/cursos/cursos.component';
import { CertificacionesComponent } from './Components/certificaciones/certificaciones.component';
import { RegistroHabilidadesComponent } from './Components/registro-habilidades/registro-habilidades.component';
import { DisponibilidadComponent } from './Components/disponibilidad/disponibilidad.component';
import { MenucurycertComponent } from './Components/menucurycert/menucurycert.component'; 
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MenuBarComponent,
    LayoutComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    EmpleadoDetallesComponent,
    CursosComponent,
    CertificacionesComponent,
    RegistroHabilidadesComponent,
    DisponibilidadComponent,
    MenucurycertComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,  
    MatIconModule      
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }