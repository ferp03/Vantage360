import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../envs/environment';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    return this.http.post(`${this.apiUrl}/certificado`, formData);
  }

  //obtenerCertificados(): Observable<any> {
    //return this.http.get(`${this.apiUrl}/certificados`);
  //}

  // eliminarCertificado(id: string): Observable<any> {
  //  return this.http.delete(`${this.apiUrl}/certificados/${id}`);
  //}

  obtenerCertificadosPorEmpleado(empleadoId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/api/${empleadoId}`);
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
  updateEmpleadoInfo(id: string, datos: { usuario: string, estado_laboral: string, ciudad_id: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/info/${id}`, datos); // actualiza correo y usuario
  }

  // CREAR nueva experiencia
  createExperiencia(empleadoId: string, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/empleado/${empleadoId}/experiencia`, datos);
  }
  
  // ACTUALIZAR experiencia existente
  updateExperiencia(historialId: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/experiencia/${historialId}`, datos);
  }
  
  // ELIMINAR experiencia existente
  deleteExperiencia(historialId: number): Observable<any> {
    // Convertir explícitamente a número para asegurar consistencia de tipos
    const id = Number(historialId);
    
    console.log(`[ApiService] Enviando solicitud de eliminación para historial_id: ${id}, tipo: ${typeof id}`);
    
    // Usar el endpoint correcto y asegurar que se manejan los errores
    return this.http.delete<any>(`${this.apiUrl}/empleado/experiencia/${id}`)
      .pipe(
        catchError(error => {
          console.error('[ApiService] Error completo al eliminar experiencia:', error);
          
          // Rethrow para que el componente pueda manejarlo
          return throwError(() => error);
        })
      );
  }
  
  // Validar contraseña actual
  validarContrasena(id: string, actualContrasena: string, correo: string): Observable<any> {
    const datos = {"actualContrasena": actualContrasena, "email": correo};
    return this.http.post(`${this.apiUrl}/empleado/validar-contrasena/${id}`, datos);
  }
  
  // Cambiar contraseña
  cambiarContrasena(id: string, nuevaContrasena: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/cambiar-contrasena/${id}`, {
      nuevaContrasena
    });
  }

  // Crear nueva habilidad
  agregarHabilidad(empleadoId: string, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/empleado/${empleadoId}/habilidad`, datos);
  } 

  getCapabilities(): Observable<any> {
    return this.http.get(`${this.apiUrl}/capabilities`);
  } 

  getCiudades(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ciudades`);
  }

  getLeads(): Observable<any> {
    return this.http.get(`${this.apiUrl}/leads`);
  }

  getHabilidades(): Observable<any> {
    return this.http.get(`${this.apiUrl}/habilidades`);
  }


  // actualizarEmpleado(empleadoId: string, datosActualizados: any): Observable<any> {
  //   return this.http.put(`${this.apiUrl}/empleado/cambiar-datos/${empleadoId}`, datosActualizados); // solo cambia estado laboral
  // }

  // Crear nuevo curso con archivo 
  crearCurso(empleadoId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/empleado/${empleadoId}/curso`, formData);
  }

  // Obtener cursos de un empleado
  obtenerCursosEmpleado(empleadoId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/${empleadoId}/cursos`);
  }

  // Actualizar curso 
  actualizarCurso(cursoId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/curso/${cursoId}`, formData);
  }
   
  // Eliminar curso
  eliminarCurso(empleadoId: string, cursoId: string) {
    return this.http.delete<any>(`${this.apiUrl}/empleado/${empleadoId}/curso/${cursoId}`);
  }

  // Eliminar certificado
  eliminarCertificado(certificacionId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/certificado/${certificacionId}`);
}

  // Editar Curso
  editarCurso(empleadoId: string, cursoId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/${empleadoId}/curso/${cursoId}`, formData);
  }
 
  //Subir proyecto
  subirProyecto(json: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto`, json);
  }

  // Obtener API Key de Gemini
  getGeminiApiKey(): Observable<any> {
  return this.http.get(`${this.apiUrl}/gemini-api-key`);
}

  // Obtener proyectos disponibles
  getProyectosDisponibles(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/proyecto/disponibles/${userId}`);
  }

  // Obtener proyectos disponibles
  getProyectosActuales(userId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/proyecto/actuales/${userId}`);
  }
} 