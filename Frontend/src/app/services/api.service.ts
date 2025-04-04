import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../envs/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {email, password});
  }

  signup(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, {username, email, password});
  }

  forgot_password(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recover`, {email});
  }

  fetchChuck(category: string, num: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/chuckNorris`, {category, num});
  }

  fetchCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  // Info básica del empleado
  getEmpleadoInfo(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/info/${id}`);
  }

  // Habilidades
  getEmpleadoHabilidades(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/${id}/habilidades`);
  }

  // Certificaciones
  getEmpleadoCertificaciones(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/${id}/certificaciones`);
  }
  
  // Trayectoria
  getEmpleadoTrayectoria(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/${id}/trayectoria`);
  }
  
  // Actualizar info básica
  updateEmpleadoInfo(id: string, datos: { correo: string; usuario: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/info/${id}`, datos);
  }

  // CREAR nueva experiencia
  createExperiencia(empleadoId: string, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/empleado/${empleadoId}/experiencia`, datos);
  }
  
  // ACTUALIZAR experiencia existente
  updateExperiencia(historialId: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/experiencia/${historialId}`, datos);
  }
  
  // Validar contraseña actual
  validarContrasena(id: string, actualContrasena: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/validar-contrasena/${id}`, {
      params: { actualContrasena }
    });
  }
  
  // Cambiar contraseña
  cambiarContrasena(id: string, nuevaContrasena: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/cambiar-contrasena/${id}`, {
      nuevaContrasena
    });
  }
}
