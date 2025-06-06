import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/envs/environment';

interface Notification {
  id: number;
  message: string;
  date: Date;
  read: boolean;
  certificateId: number;
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
  unreadNotificationsCount = 0;
  private notificationCheckInterval: any;
  hasUnreadNotifications = false;

  constructor(
    private auth: AuthService,
    private http: HttpClient
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