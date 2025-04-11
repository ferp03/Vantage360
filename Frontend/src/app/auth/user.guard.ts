import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common'; // Import Location service
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserGuard  {
  constructor(private auth: AuthService, private router: Router, private location: Location) {}

  canActivate(): boolean{
    const roles = this.auth.roles;
    const rolesPremitidos = ['delivery lead', 'people lead'];

    if(this.auth.estaAutenticado() && roles.some(role => rolesPremitidos.includes(role))){
      return true;
    }else{
      this.location.back();
      return false;
    }
  }
}
