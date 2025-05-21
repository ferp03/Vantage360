import { Component, OnInit } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-recomendaciones',
  templateUrl: './recomendaciones.component.html',
  styleUrls: ['./recomendaciones.component.css']
})
export class RecomendacionesComponent implements OnInit {
  cursos: any[] = [];
  certificados: any[] = [];
  empleadoId = '';
  cargando = false;
  error: string | null = null;
  estado: 'inicio' | 'cargando' | 'listo' = 'inicio';

  recomendacionesCursos: { titulo: string, descripcion: string }[] = [];
  recomendacionesCertificados: { titulo: string, descripcion: string }[] = [];

  constructor(
    private geminiService: GeminiService,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.auth.userId;
    if (userId) {
      this.empleadoId = userId;
      this.cargarCursosYCertificados();
    } else {
      this.error = 'No se pudo obtener el ID del usuario.';
    }
  }

  cargarCursosYCertificados(): void {
    this.api.obtenerCursosEmpleado(this.empleadoId).subscribe({
      next: (resCursos) => {
        this.cursos = resCursos.data || [];
        this.api.obtenerCertificadosPorEmpleado(this.empleadoId).subscribe({
          next: (resCerts) => {
            this.certificados = resCerts.data || [];
          },
          error: (err) => {
            console.error(err);
            this.error = 'Error al cargar certificados.';
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar cursos.';
      }
    });
  }

  generarRecomendaciones(): void {
    this.estado = 'cargando';
    this.cargando = true;
    this.error = null;
    this.recomendacionesCursos = [];
    this.recomendacionesCertificados = [];

    const nombresCursos = this.cursos.map(c => c.nombre);
    const nombresCertificados = this.certificados.map(c => c.nombre);

    const prompt = `
Un empleado ha completado los siguientes cursos: ${nombresCursos.join(', ')}.
Y ha obtenido los siguientes certificados: ${nombresCertificados.join(', ')}.
Sugiere exclusivamente cursos adicionales y certificaciones útiles para su desarrollo profesional.

Formato obligatorio:
Nombre del curso o certificación – Breve descripción.

Condiciones:
- Máximo 6 palabras en el nombre.
- La descripción debe ser clara, útil y rica en contenido, con tanto detalle como sea posible sin exceder 50 palabras. Usa el espacio completo si es necesario.
- No uses viñetas, ni negritas, ni encabezados.
- No incluyas introducción, solo las recomendaciones en el formato solicitado.
- Clasifica primero los cursos, luego las certificaciones.
- Devuelve solo 3 de cada uno.
`;

    this.geminiService.generarRespuesta(prompt).subscribe({
      next: (res: any) => {
        const textoRespuesta = res.candidates[0]?.content?.parts[0]?.text || '';
        const recomendaciones = this.formatearRecomendacion(textoRespuesta);

        this.recomendacionesCursos = recomendaciones.slice(0, 3);
        this.recomendacionesCertificados = recomendaciones.slice(3, 6);

        this.estado = 'listo';
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error completo:', err);
        this.error = 'Error al generar recomendaciones.';
        this.estado = 'inicio';
        this.cargando = false;
      }
    });
  }

  formatearRecomendacion(texto: string): { titulo: string, descripcion: string }[] {
    const lineas = texto.split('\n').filter(linea => linea.includes('–'));
    const resultados: { titulo: string, descripcion: string }[] = [];

    for (let linea of lineas) {
      const [tituloRaw, descripcionRaw] = linea.split('–').map(p => p.trim());

      if (tituloRaw && descripcionRaw) {
        const titulo = tituloRaw.split(' ').slice(0, 6).join(' ');
        const descripcion = descripcionRaw.split(' ').slice(0, 50).join(' ');

        resultados.push({ titulo, descripcion });
      }
    }

    return resultados;
  }
}
