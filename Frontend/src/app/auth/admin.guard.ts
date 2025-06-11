import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard  {
  constructor(private auth: AuthService, private router: Router, private location: Location) {}

  canActivate(): boolean{
    const roles = this.auth.roles;
    const rolesPremitidos = ['admin'];

    if(this.auth.estaAutenticado() && roles.includes('admin')){
      return true;
    }else{
      this.location.back();
      return false;
    }
  }
}
