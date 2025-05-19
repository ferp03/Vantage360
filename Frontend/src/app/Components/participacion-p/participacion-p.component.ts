import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { ProyectosComponent } from '../proyectos/proyectos.component'; 

@Component({
  selector: 'app-participacion-p',
  templateUrl: './participacion-p.component.html',
  styleUrls: ['./participacion-p.component.css']
})
export class ParticipacionPComponent {
  activeTab: string = 'disponibles'; 

  constructor(
    public authService: AuthService,
    private dialog: MatDialog
  ) {}

  openTab(tabId: string) {
    this.activeTab = tabId;
  }

  showAddProjectButton(): boolean {
    const allowedRoles = ['people lead', 'delivery lead'];
    return this.authService.roles.some(role => allowedRoles.includes(role));
  }

  openAddProjectModal(): void {
    const dialogRef = this.dialog.open(ProyectosComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { 
        action: 'create' // Puedes enviar datos adicionales si es necesario
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Proyecto creado:', result);
        // Aquí puedes actualizar la lista de proyectos si es necesario
      }
    });
  }
}