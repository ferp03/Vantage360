import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../envs/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  signup(name: string, patlastname:string, matlastname: string, username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, {name, patlastname, matlastname, username, email, password});
  }

  forgot_password(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recover`, { email });
  }

  fetchChuck(category: string, num: number): Observable<any> {
    console.log(category);
    return this.http.post(`${this.apiUrl}/chuckNorris`, { category, num });
  }

  fetchCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  // Obtener todos los empleados con su información de disponibilidad
  getEmpleadosDisponibilidad(): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleados/disponibilidad`);
  }

  // Filtrar empleados disponibles con criterios específicos
  getEmpleadosDisponibles(filtros: any = {}): Observable<any> {
    let params = new HttpParams();
    if (filtros.habilidad) params = params.set('habilidad', filtros.habilidad);
    if (filtros.certificacion) params = params.set('certificacion', filtros.certificacion);
    if (filtros.rol) params = params.set('rol', filtros.rol);
    
    return this.http.get(`${this.apiUrl}/empleados/disponibles`, { params });
  }

  // Actualizar disponibilidad manualmente
  actualizarDisponibilidad(empleadoId: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleados/${empleadoId}/disponibilidad`, datos);
  }
}