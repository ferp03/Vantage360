import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent {
  isLogged = false;
  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.authStatus().subscribe(status => {
      this.isLogged = status;
    });
  }
  logout(): void{
    this.auth.logout()
  }
}
