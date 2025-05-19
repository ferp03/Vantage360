import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-participacion-p',
  templateUrl: './participacion-p.component.html',
  styleUrls: ['./participacion-p.component.css']
})
export class ParticipacionPComponent {
  activeTab: string = 'disponibles'; 

  openTab(tabId: string) {
    this.activeTab = tabId;
  }

  proyecto = {
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    progreso: 0,
    cargabilidad: 0,
    delivery_lead: '',
    capabilities: [] 
  }
}