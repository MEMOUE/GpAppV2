import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Besoin} from '../model/Besoin';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BesoinService {
  private apiURL: string = 'http://localhost:8080/api/';
  private besoinEndpoint: string = `${this.apiURL}besoins`;

  constructor(private http: HttpClient) { }


  addBesoin(data: Besoin): Observable<Besoin> {
    return this.http.post<Besoin>(this.besoinEndpoint, data);
  }

  getAllBesoins(): Observable<Besoin[]> {
    return this.http.get<Besoin[]>(this.besoinEndpoint);

  }

  // Get a single besoin by ID
  getBesoin(id: number): Observable<Besoin> {
    return this.http.get<Besoin>(`${this.besoinEndpoint}/${id}`);
  }

  // Update an existing besoin
  onEdit(besoin: Besoin): Observable<Besoin> {
    return this.http.put<Besoin>(`${this.besoinEndpoint}/${besoin.id}`, besoin);
  }
  deleteGp(id: number): Observable<void> {
    return this.http.delete<void>(`${this.besoinEndpoint}/${id}`);
  }
}
