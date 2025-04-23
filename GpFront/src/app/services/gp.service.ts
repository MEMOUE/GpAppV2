import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Programmegp} from '../model/Programmegp';
import {Besoin} from '../model/Besoin';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GpService {

  private apiURL: string = `${environment.apiUrl}`;
  private gpEndpoint: string = `${this.apiURL}programmegp`;
  private gpEndpoint_searsh: string = `${this.apiURL}programmegp/searsh`;


  constructor(private http: HttpClient) {}

  addgp(data: Programmegp): Observable<Programmegp> {

    return this.http.post<Programmegp>(this.gpEndpoint, data);
  }
  getAllgp(): Observable<Programmegp[]> {
    return this.http.get<Programmegp[]>(this.gpEndpoint);

/////////////         OffreGP               /////////////////////////////
  }
  getOffres(depart: string, destination: string): Observable<Programmegp[]> {
    return this.http.get<Programmegp[]>(`${this.gpEndpoint_searsh}?depart=${depart}&destination=${destination}`);
  }

  // Update an existing besoin
  updategp(besoin: Programmegp): Observable<Programmegp> {
    return this.http.put<Programmegp>(`${this.gpEndpoint}/${besoin.id}`, besoin);
  }

  // Supprimer un programme
  deleteGp(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}programmegp/${id}`);
  }

  getById(id: number): Observable<Programmegp> {
    return this.http.get<Programmegp>(`${this.gpEndpoint}/${id}`);
  }


}
