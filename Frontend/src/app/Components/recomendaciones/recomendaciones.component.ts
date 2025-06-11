import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { GeminiService } from '../../services/gemini.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../auth/auth.service';

interface RecomItem {
  titulo: string;
  descripcion: string;
  porcentaje?: string;
}

@Component({
  selector: 'app-recomendaciones',
  templateUrl: './recomendaciones.component.html',
  styleUrls: ['./recomendaciones.component.css']
})
export class RecomendacionesComponent implements OnInit {
  cursos: any[] = [];
  certificados: any[] = [];
  habilidades: string[] = [];
  empleadoId = '';
  cargando = false;
  error: string | null = null;
  estado: 'inicio' | 'cargando' | 'listo' = 'inicio';
  recomendacionesCursos: RecomItem[] = [];
  recomendacionesCertificados: RecomItem[] = [];
  recomendacionesProyectos: RecomItem[] = [];
  private recomendacionesGeneradas = false;

  constructor(
    private gemini: GeminiService,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.auth.userId;
    if (!id) {
      this.error = 'No se pudo obtener el ID del usuario.';
      return;
    }
    this.empleadoId = id;
    forkJoin({
      cursos: this.api.obtenerCursosEmpleado(id),
      certificados: this.api.obtenerCertificadosPorEmpleado(id),
      habilidades: this.api.getEmpleadoHabilidades(id)
    }).subscribe({
      next: ({ cursos, certificados, habilidades }) => {
        this.cursos = cursos?.data || [];
        this.certificados = certificados?.data || [];
        this.habilidades = (habilidades?.data || []).flatMap((h: any) => this.tokens(h.nombre));
        
        if (!this.recomendacionesGeneradas) {
          this.generarRecomendaciones();
          this.recomendacionesGeneradas = true;
        }
      },

      error: () => (this.error = 'Error al cargar datos iniciales.')
    });
  }

  generarRecomendaciones(): void {
    this.estado = 'cargando';
    this.cargando = true;
    this.error = null;
    this.recomendacionesCursos = [];
    this.recomendacionesCertificados = [];
    this.recomendacionesProyectos = [];
    let cursosCertsReady = false;
    let proyectosReady = false;
    const done = () => {
      if (cursosCertsReady && proyectosReady) {
        this.estado = 'listo';
        this.cargando = false;
      }
    };
    this.recomendarCursosCerts(() => {
      cursosCertsReady = true;
      done();
    });
    this.recomendarProyectos(() => {
      proyectosReady = true;
      done();
    });
  }

  private recomendarCursosCerts(cb: () => void): void {
    const cursosCorpTomados = this.cursos
      .filter(c => this.esCapacitacionCorp(c.nombre))
      .map(c => c.nombre);
    const cursosCorpTexto = cursosCorpTomados.length > 0 ? cursosCorpTomados.join(', ') : 'ninguno';
    const certificadosTomados = this.certificados.map(c => c.nombre).join(', ') || 'ninguno';
    const skillsTexto = Array.from(new Set(this.habilidades)).join(', ') || 'ninguna';

    const prompt = `
El empleado ha completado las siguientes CAPACITACIONES CORPORATIVAS obligatorias: ${cursosCorpTexto}.
También posee estos certificados: ${certificadosTomados}.
Sus principales habilidades técnicas son: ${skillsTexto}.

TAREA: 
• Propón EXACTAMENTE 3 nuevas CAPACITACIONES CORPORATIVAS (ética, RSC, ciberseguridad, cumplimiento, salud y seguridad, etc.) que NO estén en la lista anterior.
• Propón EXACTAMENTE 3 certificaciones NUEVAS que complementen sus habilidades y perfil.

REQUISITOS PARA CADA RECOMENDACIÓN:
• El nombre debe tener un máximo de 8 palabras.
• La explicación debe tener entre 20 y 60 palabras. No puede ser una sola palabra, ni una frase genérica. Debe explicar cómo esa capacitación o certificación es útil o relevante para el empleado.

FORMATO (una línea por recomendación, sin encabezados ni listas):
Nombre – Explicación (entre 20 y 60 palabras). Sin usar guiones, asteriscos ni markdown.
PRIMERO los 3 cursos, luego las 3 certificaciones.
`;

    this.gemini.generarRespuesta(prompt).subscribe({
      next: res => {
        const txt = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const items = this.parseLineas(txt);

        const isValidDescripcion = (desc: string) => desc.split(' ').length >= 10;

        this.recomendacionesCursos = items.slice(0, 3).map(item => ({
          ...item,
          descripcion: isValidDescripcion(item.descripcion)
            ? item.descripcion
            : 'Capacitación relevante que fortalece tus competencias en cumplimiento y responsabilidad profesional.'
        }));

        this.recomendacionesCertificados = items.slice(3, 6).map(item => ({
          ...item,
          descripcion: isValidDescripcion(item.descripcion)
            ? item.descripcion
            : 'Certificación que complementa tu perfil técnico y mejora tu proyección profesional.'
        }));

        cb();
      },
      error: () => {
        this.error = 'Error al generar cursos y certificaciones.';
        cb();
      }
    });
  }

  private recomendarProyectos(cb: () => void): void {
    this.api.getProyectosDisponibles(this.empleadoId).subscribe({
      next: r => {
        const proyectos = (r.proyectos || r || []) as any[];
        const rank = proyectos
          .map(p => {
            const reqSet = new Set<string>();
            (p.habilidades || []).forEach((h: any) => this.tokens(h.nombre).forEach(tok => reqSet.add(tok)));
            const req = Array.from(reqSet);
            const match = req.filter(rq => this.habilidades.includes(rq));
            const pct = req.length ? Math.round((match.length / req.length) * 100) : 0;
            return {
              id: p.proyecto_id,
              nombre: p.nombre,
              descripcion: p.descripcion,
              req,
              match,
              pct,
              pctTxt: `${pct}%`
            };
          })
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 3);
        const prompt = this.promptProyectos(rank);
        this.gemini.generarRespuesta(prompt).subscribe({
          next: resIA => {
            const txt = resIA?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const explic = this.parseLineas(txt);
            this.recomendacionesProyectos = rank.map((p, i) => ({
              titulo: p.nombre,
              descripcion: explic[i]?.descripcion || 'Proyecto relevante para tu crecimiento.',
              porcentaje: p.pctTxt
            }));
            cb();
          },
          error: () => {
            this.recomendacionesProyectos = rank.map(p => ({
              titulo: p.nombre,
              descripcion: 'Proyecto relevante para tu desarrollo profesional y para aplicar tus competencias.',
              porcentaje: p.pctTxt
            }));
            cb();
          }
        });
      },
      error: () => {
        this.error = 'Error al obtener proyectos.';
        cb();
      }
    });
  }

  private promptProyectos(lista: { nombre: string; descripcion: string; pct: number; match: string[] }[]): string {
    const habilidadesEmpleado = Array.from(new Set(this.habilidades)).join(', ') || 'ninguna';
    const detalle = lista
      .map(
        (p, i) => `
${i + 1}. ${p.nombre}
Descripción: ${p.descripcion}
Habilidades relevantes del empleado: ${p.match.join(', ') || 'N/A'}
Grado de afinidad con el perfil: ${p.pct}%`
      )
      .join('\n');
    return `
Eres asesor de carrera. El empleado domina las siguientes habilidades: ${habilidadesEmpleado}.

Redacta UNA sola línea por proyecto, con el formato:
Nombre del proyecto – Explicación (máx. 60 palabras) resaltando cómo el proyecto impulsa mi desarrollo profesional y me permite aplicar o ampliar al menos una de sus habilidades mencionadas.
No uses listas, encabezados, porcentajes, asteriscos ni markdown.

${detalle}
`;
  }

  private parseLineas(txt: string): RecomItem[] {
    const clean = (s: string) => s.replace(/^(\*\*|\*)\s*/, '').trim();
    return txt
      .split('\n')
      .filter(l => l.includes('–') || l.includes('-'))
      .map(l => l.replace(' - ', ' – '))
      .map(l => {
        const [tit, desc] = l.split('–').map(s => clean(s));
        return { titulo: tit, descripcion: desc };
      });
  }

  private esCapacitacionCorp(nombre: string): boolean {
    return /ética|integridad|cumplimiento|compliance|anticorrup|soborno|responsabilidad|sostenibilidad|diversidad|inclusi[oó]n|ciber|phishing|fraude|datos|seguridad de la informaci[oó]n|acoso|salud y seguridad|protecci[oó]n civil|emergencia/i.test(
      nombre
    );
  }

  private tokens(original: string): string[] {
    return original
      .toLowerCase()
      .replace(/[._]/g, ' ')
      .split(/[,/]| y |\&/g)
      .map(t => t.trim())
      .filter(Boolean);
  }
}
