import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgenceService {
  private apiUrl = 'http://localhost:8080/api/agentgp/agence';

  constructor(private http: HttpClient) {}

  /////////////         OffreGP               /////////////////////////////

  getAgences(depart: string, destination: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?depart=${depart}&destination=${destination}`);
  }
}
