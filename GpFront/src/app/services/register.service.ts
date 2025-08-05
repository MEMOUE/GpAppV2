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
  private agentEndpoint: string = `${this.apiURL}agentgp`; // Endpoint original qui attend multipart/form-data

  constructor(private http: HttpClient) {}

  registerUser(data: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.userEndpoint, data);
  }

  registerAgent(data: any, files: { [key: string]: File }): Observable<any> {
    // Créer un FormData pour envoyer les fichiers et les données
    const formData = new FormData();
    
    // Ajouter les données texte
    formData.append('username', data.username);
    formData.append('password', data.password);
    formData.append('email', data.email);
    formData.append('nomagence', data.nomagence);
    formData.append('adresse', data.adresse);
    formData.append('telephone', data.telephone);
    
    // Ajouter les destinations comme string séparée par des virgules
    if (data.destinations && Array.isArray(data.destinations)) {
      formData.append('destinations', data.destinations.join(','));
    } else if (data.destinations) {
      formData.append('destinations', data.destinations);
    }
    
    // Ajouter les fichiers
    if (files['logo']) {
      formData.append('logo', files['logo']);
    }
    
    if (files['carteIdentite']) {
      formData.append('carteIdentite', files['carteIdentite']);
    }

    return this.http.post<any>(this.agentEndpoint, formData);
  }
}