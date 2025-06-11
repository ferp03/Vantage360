import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/envs/environment';
import { ApiService } from 'src/app/services/api.service';

interface Notification {
  id: number;
  message: string;
  date: Date;
  read: boolean;
  certificateId?: number; // Para certificados
  solicitudStatus?: string; // Para solicitudes
}

interface Solicitud {
  id: number;
  proyecto_nombre: string;
  capability: string;
  fecha_emision: Date;
  status: string;
}

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent implements OnInit {
  isLogged = false;
  menuAbierto = false;
  notificationMenuAbierto = false;
  notifications: Notification[] = [];
  Soliticitudes: Solicitud[] = [];
  SoliticitudesLead: Solicitud[] = [];
  unreadNotificationsCount = 0;
  private notificationCheckInterval: any;
  hasUnreadNotifications = false;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  empleadoId = this.auth.userId;
  username = this.auth.username;

  private previousUserId: string | null = null;

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('notificationMenu') notificationMenuElement!: ElementRef;

  ngOnInit() {
    this.auth.authStatus().subscribe(status => {
      this.isLogged = status;
      if (status) {
        // Verificar si el usuario ha cambiado
        if (this.empleadoId !== this.previousUserId) {
          this.clearNotifications();
          this.previousUserId = this.empleadoId;
        }
        
        this.loadNotifications();
        this.setupNotificationInterval();
      } else {
        this.clearNotificationInterval();
      }
    });
  }

  borrarSolicitud(n: Notification) {
    this.notifications = this.notifications.filter(notif => notif.id !== n.id);
    this.updateUnreadCount();
    this.saveNotificationsToLocalStorage();

    // deleteSolicitud
    this.apiService.deleteSolicitud(n.id).subscribe({
      next: () => {
        console.log(`Solicitud ${n.id} eliminada correctamente.`);
      }
      , error: (error) => {
        console.error(`Error al eliminar la solicitud ${n.id}:`, error);
      }
    });
  }

  async loadNotifications() {
    if (!this.empleadoId) return;

    try {
      // Siempre limpiar notificaciones antes de cargar nuevas para este usuario
      this.notifications = [];
      
      const response: any = await this.http.get(
        `${environment.apiUrl}/empleado/${this.empleadoId}/certificados`
      ).toPromise();

      const certificados = response.data || [];
      const nuevasNotificaciones: Notification[] = [];
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      certificados.forEach((certificado: any) => {
        if (certificado.fecha_vencimiento) {
          const fechaVencimiento = new Date(certificado.fecha_vencimiento);
          fechaVencimiento.setHours(0, 0, 0, 0);

          const diffTime = fechaVencimiento.getTime() - hoy.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 0 && diffDays <= 30) {
            const mensaje = `Quedan ${diffDays} días para el vencimiento de ${certificado.nombre}`;
            const notificationId = certificado.certificacion_id;

            nuevasNotificaciones.push({
              id: notificationId,
              message: mensaje,
              date: new Date(),
              read: false,
              certificateId: certificado.certificacion_id
            });
          }
        }
      });

      // solicitudes del empleado
      const solicitudesResponse: any = await this.http.get(
        `${environment.apiUrl}/empleado/${this.empleadoId}/solicitudes`
      ).toPromise();
      this.Soliticitudes = solicitudesResponse.data || [];
      console.log('Solicitudes:', this.Soliticitudes);
      this.Soliticitudes.forEach((solicitud: any) => {
        if (solicitud.status === 'Pendiente') {
          nuevasNotificaciones.push({
            id: solicitud.id,
            message: `Tienes una solicitud ${solicitud.status} en el proyecto "${solicitud.proyecto_nombre}" (${solicitud.capability})`,
            date: new Date(solicitud.fecha_emision),
            read: false,
            solicitudStatus: solicitud.status
          });
        }
        if (solicitud.status === 'Aceptado' || solicitud.status === 'Rechazado') {
          nuevasNotificaciones.push({
            id: solicitud.id,
            message: `Tu solicitud fue ${solicitud.status} en el proyecto "${solicitud.proyecto_nombre}" (${solicitud.capability})`,
            date: new Date(solicitud.fecha_emision),
            read: false,
            solicitudStatus: solicitud.status
          });
        }
      });

      // Solicitudes del delivery lead
      const solicitudesDeliveryResponse: any = await this.http.get(
        `${environment.apiUrl}/lead/${this.empleadoId}/solicitudes`
      ).toPromise();
      this.SoliticitudesLead = solicitudesDeliveryResponse.data || [];
      console.log('Solicitudes:', this.SoliticitudesLead);
      this.SoliticitudesLead.forEach((solicitud: any) => {
        if (solicitud.status === 'Pendiente') {
          nuevasNotificaciones.push({
            id: solicitud.id,
            message: `Tienes una solicitud pendiente de checar del proyecto "${solicitud.proyecto_nombre}" (${solicitud.capability})`,
            date: new Date(solicitud.fecha_emision),
            read: false,
            solicitudStatus: solicitud.status
          });
        }
      });

      this.notifications = nuevasNotificaciones;
      this.updateUnreadCount();
      this.saveNotificationsToLocalStorage();

    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }

  private saveNotificationsToLocalStorage() {
    if (this.empleadoId) {
      localStorage.setItem(`notifications_${this.empleadoId}`, JSON.stringify(this.notifications));
    }
  }

  private loadNotificationsFromLocalStorage() {
    if (this.empleadoId) {
      const savedNotifications = localStorage.getItem(`notifications_${this.empleadoId}`);
      if (savedNotifications) {
        this.notifications = JSON.parse(savedNotifications).map((n: any) => ({
          ...n,
          date: new Date(n.date)
        }));
        this.updateUnreadCount();
      }
    }
  }

  private setupNotificationInterval() {
    // Limpiar intervalo previo si existe
    this.clearNotificationInterval();
    
    // Configurar nuevo intervalo (30 minutos)
    this.notificationCheckInterval = setInterval(() => {
      this.loadNotifications();
    }, 30 * 60 * 1000);
  }

  private clearNotificationInterval() {
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
      this.notificationCheckInterval = null;
    }
  }

  private clearNotifications() {
    this.notifications = [];
    this.unreadNotificationsCount = 0;
    localStorage.removeItem(`notifications_${this.empleadoId}`);
  }

  toggleNotificationMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.notificationMenuAbierto = !this.notificationMenuAbierto;
    
    if (this.notificationMenuAbierto && this.hasUnreadNotifications) {
      this.markNotificationsAsRead();
    }
  }

  markNotificationsAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.updateUnreadCount();
    this.saveNotificationsToLocalStorage();
  }

  updateUnreadCount() {
    this.unreadNotificationsCount = this.notifications.filter(n => !n.read).length;
    this.hasUnreadNotifications = this.unreadNotificationsCount > 0;
  }

  logout(): void {
    this.auth.logout();
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
    }
  }
  
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const clickedInsideMenu = this.menuElement?.nativeElement.contains(event.target);
    const clickedInsideNotification = this.notificationMenuElement?.nativeElement.contains(event.target);
    
    if (!clickedInsideMenu) {
      this.menuAbierto = false;
    }
    
    if (!clickedInsideNotification) {
      this.notificationMenuAbierto = false;
    }
  }

  // FUNCIÓN esAdmin() MANTENIDA PARA OTROS USOS
  esAdmin(): boolean {
    const roles = this.auth.roles;
    return roles.includes('delivery lead') || roles.includes('people lead');
  }

  esSuperadmin(): boolean {
    const roles = this.auth.roles;
    return roles.includes('admin');
  }
}