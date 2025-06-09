import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../envs/environment';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  authService: any;

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

  // Actualizar disponibilidad manualmente
  actualizarComentarios(empleadoId: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleados/${empleadoId}/comentarios`, datos);
  }

  // Info básica del empleado
  getEmpleadoInfo(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/info/${id}`);
  }

  // Habilidades
  getEmpleadoHabilidades(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/${id}/habilidades`).pipe(
      map((res: any) => {
        if (res.success) {
          // Normalizar los datos para que siempre sean objetos completos
          res.data = res.data.map((hab: any) => {
            if (typeof hab === 'string') {
              return {
                nombre: hab,
                nivel: 'Nivel no especificado',
                descripcion: 'Descripción no disponible'
              };
            }
            return hab; // Si ya es objeto, dejarlo como está
          });
        }
        return res;
      }),
      catchError(error => {
        console.error('Error al obtener habilidades:', error);
        return throwError(error);
      })
    );
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

  // Unirse a un proyecto
  unirseAProyecto(empleadoId: string, proyectoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyecto/unirse`, {
      empleado_id: empleadoId,
      proyecto_id: proyectoId
    }).pipe(
      catchError(error => {
        console.error('Error en la solicitud:', error);
        return throwError(() => error);
      })
    );
  }

  // Eliminar Habilidad
  deleteEmpleadoHabilidad(empleadoId: string, habilidadId: number) {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/empleado/${empleadoId}/habilidad/${habilidadId}`
    );
  }

  // Actualizar Habilidad
  updateEmpleadoHabilidad(empleadoId: string, habilidadId: number, datos: {nivel: string, descripcion: string}): Observable<any> {
      return this.http.put(`${this.apiUrl}/empleado/${empleadoId}/habilidad/${habilidadId}`, datos);
    }

  obtenerComentarioEmpleado(empleadoId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleado/${empleadoId}/comentarios`);
  }

  agregarComentario(empleadoId: string, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/empleado/${empleadoId}/comentarios`, datos);
  }


  actualizarProyecto(proyecto: {
    proyecto_id: number;
    nombre?: string;
    descripcion?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    progreso?: number;
    puesto?: string;
    habilidades?: string[];
    userId?: string; }): Observable<any> {return this.http.put(`${this.apiUrl}/proyecto/${proyecto.proyecto_id}`, {...proyecto
    }).pipe(
      catchError(error => {
        console.error('Error en la solicitud:', error);
        let errorMsg = 'Error al actualizar proyecto';
        if (error.status === 403) errorMsg = 'No tienes permisos para editar';
        if (error.status === 404) errorMsg = 'Proyecto no encontrado';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  actualizarHabilidadesProyecto(proyectoId: number, habilidades: any[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/proyecto/${proyectoId}/habilidades`, {
      habilidades 
    }).pipe(
      catchError(error => {
        console.error('Error al actualizar habilidades:', error);
        return throwError(() => new Error('Error al actualizar habilidades del proyecto'));
      })
    );
  }

  obtenerIntegrantesProyecto(proyectoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/proyecto/${proyectoId}/integrantes`);
  }

  subirArchivoExcel( formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-excel`, formData, {
      headers: new HttpHeaders({
        'enctype': 'multipart/form-data'
      })
    }).pipe(
      catchError(error => {
        console.error('Error al subir archivo Excel:', error);
        return throwError(() => new Error('Error al subir archivo Excel'));
      })
    );
  }
} 
