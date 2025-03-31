import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { catchError, tap, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<boolean>(this.estaAutenticado());

  constructor(private router: Router, private api: ApiService, @Inject(PLATFORM_ID) private platformId: Object) { }


  login(email: string, password: string): Observable<any> {
    return this.api.login(email, password).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('username', res.username);
          this.authState.next(true);
        }
      }),
      map(res => res),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.authState.next(false);
    this.router.navigate(['/login']);
  }

  estaAutenticado(): boolean{
    if(isPlatformBrowser(this.platformId)){
      return !! localStorage.getItem('token');
    }
    return false;
  }

  authStatus(): Observable<boolean>{
    return this.authState.asObservable();
  }
}
