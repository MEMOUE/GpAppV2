import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Utilisateur} from '../model/Utilisateur';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private apiURL: string = `${environment.apiUrl}`;
  private userEndpoint: string = `${this.apiURL}user`;
  private agentEndpoint: string = `${this.apiURL}agentgp`;


  constructor(private http: HttpClient) {}

  registerUser(data: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.userEndpoint, data);
  }

  registerAgent(data: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.agentEndpoint, data);
  }

}
