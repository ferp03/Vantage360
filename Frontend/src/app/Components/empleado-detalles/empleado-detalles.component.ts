import { Component } from '@angular/core';

@Component({
  selector: 'app-empleado-detalles',
  templateUrl: './empleado-detalles.component.html',
  styleUrls: ['./empleado-detalles.component.css']
})
export class EmpleadoDetallesComponent {
  experiencias = [
    {
      titulo: 'Desarrollador ITSM Path',
      empresa: 'V360 Software',
      inicio: '2022-01-01',
      fin: '2024-04-01',
      descripcion: 'Desarrollo de interfaces SPA con Angular.'
    },
    {
      titulo: 'Proyecto interno Accenture',
      empresa: 'Accenture',
      inicio: '2021-07-08',
      fin: '2022-12-31',
      descripcion: 'Desarrollo de interfaces para plataforma interna.'
    },
    {
      titulo: 'Proyecto interno Oracle',
      empresa: 'Oracle',
      inicio: '2020-03-01',
      fin: '2021-06-30',
      descripcion: 'Dashboards internos y migración de componentes.'
    },
    {
      titulo: 'Proyecto interno Accenture',
      empresa: 'Accenture',
      inicio: '2019-01-01',
      fin: '2019-12-31',
      descripcion: 'Desarrollo de interfaces para plataforma interna.'
    },
    {
      titulo: 'Proyecto interno Accenture',
      empresa: 'Accenture',
      inicio: '2018-01-01',
      fin: '2018-12-31',
      descripcion: 'Desarrollo de interfaces para plataforma interna.'
    }
  ];
}
