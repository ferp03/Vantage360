import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './Components/login/login.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { AppComponent } from './app.component';
import { MenuBarComponent } from './Components/menu-bar/menu-bar.component';
import { LayoutComponent } from './layout/layout.component';
import { AboutComponent } from './Components/about/about.component';
import { ContactComponent } from './Components/contact/contact.component';
import { ForgotPasswordComponent } from './Components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Components/reset-password/reset-password.component';
import { DisponibilidadComponent } from './Components/disponibilidad/disponibilidad.component'; // Añadir componente

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    MenuBarComponent,
    LayoutComponent,
    AboutComponent,
    ContactComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    DisponibilidadComponent // Declarar componente
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }