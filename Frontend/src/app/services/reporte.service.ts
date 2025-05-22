import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  constructor() { }

  generarReporteCargabilidad(empleados: any[]): void {
    // Ordenar empleados por cargabilidad
    const empleadosOrdenados = [...empleados].sort((a, b) => b.cargabilidad - a.cargabilidad);
    
    // Obtener top 5 y bottom 5
    const topPerformers = empleadosOrdenados.slice(0, 5);
    const bottomPerformers = empleadosOrdenados.slice(-5).reverse();
    
    // Crear PDF
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Cargabilidad de Empleados', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Top Performers
    doc.setFontSize(14);
    doc.text('Top Performers (Mayor cargabilidad)', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Nombre', 'Nivel', 'Rol', 'Capability', 'Cargabilidad']],
      body: topPerformers.map(emp => [
        `${emp.nombre} ${emp.apellido_paterno}`,
        emp.nivel,
        emp.roles.map((r: any) => r.nombre).join(', '),
        emp.capability || 'N/A',
        `${emp.cargabilidad}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [138, 86, 232] }
    });
    
    // Bottom Performers
    doc.setFontSize(14);
    doc.text('Bottom Performers (Menor cargabilidad)', 14, (doc as any).lastAutoTable.finalY + 20);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['Nombre', 'Nivel', 'Rol', 'Capability', 'Cargabilidad']],
      body: bottomPerformers.map(emp => [
        `${emp.nombre} ${emp.apellido_paterno}`,
        emp.nivel,
        emp.roles.map((r: any) => r.nombre).join(', '),
        emp.capability || 'N/A',
        `${emp.cargabilidad}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [244, 67, 54] }
    });
    
    // Guardar PDF
    doc.save(`reporte_cargabilidad_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}