import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../envs/environment';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  signup(name: string, patlastname:string, matlastname: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, {name, patlastname, matlastname, email, password});
  }

  forgot_password(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recover`, { email });
  }

  fetchChuck(category: string, num: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/chuckNorris`, {category, num});
  }

  fetchCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  guardarCertificado(formData: FormData): Observable<any> {
    // Simulación - remover cuando el backend esté listo
    console.log('Datos simulados que se enviarían:', {
      nombre_curso: formData.get('nombre_curso'),
      archivo: (formData.get('archivo') as File)?.name
    });
    
    return of({ 
      success: true,
      data: {
        id: 'simulado-' + Math.random().toString(36).substring(2),
        nombre_curso: formData.get('nombre_curso'),
        institucion: formData.get('institucion'),
        archivo_url: 'assets/placeholder-certificate.pdf',
        fecha_emision: new Date().toISOString()
      }
    });
  }

  obtenerCertificados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/certificados`);
  }

  eliminarCertificado(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/certificados/${id}`);
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
