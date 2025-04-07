import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent {
  isLogged = false;
  menuAbierto = false;
  constructor(private auth: AuthService) {}

  empleadoId = this.auth.userId;
  username = this.auth.username;

  @ViewChild('menu') menuElement!: ElementRef;


  ngOnInit() {
    this.auth.authStatus().subscribe(status => {
      this.isLogged = status;
    });
  }
  
  logout(): void{
    this.auth.logout()
  }
  
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const clickedInside = this.menuElement?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.menuAbierto = false;
    }
  }

  // Verificar si el usuario tiene rol de administrador
  esAdmin(): boolean {
    const roles = this.auth.roles;
    return roles.includes('delivery lead') || roles.includes('people lead');
  }
}