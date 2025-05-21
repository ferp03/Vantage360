import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private apiKey: string | null = null;

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  generarRespuesta(prompt: string): Observable<any> {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (this.apiKey) {
      return this.http.post(`${this.ENDPOINT}?key=${this.apiKey}`, body);
    }

    return this.apiService.getGeminiApiKey().pipe(
      tap(response => {
        this.apiKey = response.apiKey;
      }),
      switchMap(response => {
        return this.http.post(`${this.ENDPOINT}?key=${response.apiKey}`, body);
      }),
      catchError(error => {
        console.error('Error al obtener la API key o generar respuesta:', error);
        throw error;
      })
    );
  }
}