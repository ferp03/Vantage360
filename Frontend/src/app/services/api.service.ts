import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../envs/environment';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {email, password});
  }

  signup(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, {username, email, password});
  }

  forgot_password(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recover`, {email});
  }

  fetchChuck(category: string, num: number): Observable<any> {
    console.log(category);
    return this.http.post(`${this.apiUrl}/chuckNorris`, {category, num});
  }

  fetchCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  guardarCertificado(formData: FormData): Observable<any> {
    const headers = new HttpHeaders({
    });

    return this.http.post(`${this.apiUrl}/certificados`, formData, { headers });
  }

  obtenerCertificados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/certificados`);
  }

  eliminarCertificado(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/certificados/${id}`);
  }

}