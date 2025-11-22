// GpFront/src/app/services/profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  roles: any[];
  // Champs spécifiques aux agents GP
  nomagence?: string;
  adresse?: string;
  telephone?: string;
  logourl?: string;
  carteidentiteurl?: string;
  destinations?: string[];
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  password?: string;
  // Champs spécifiques aux agents GP
  nomagence?: string;
  adresse?: string;
  telephone?: string;
  destinations?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Récupérer le profil de l'utilisateur connecté
  getCurrentUserProfile(): Observable<UserProfile> {
    const userId = sessionStorage.getItem('iduser');
    const roles = JSON.parse(sessionStorage.getItem('roles') || '[]');

    // Vérifier si c'est un agent GP
    const isAgentGP = roles.includes('ROLE_AGENTGP');

    if (isAgentGP) {
      return this.http.get<UserProfile>(`${this.apiUrl}agentgp/${userId}`);
    } else {
      return this.http.get<UserProfile>(`${this.apiUrl}user/${userId}`);
    }
  }

  // Mettre à jour le profil utilisateur
  updateUserProfile(userId: number, data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}user/${userId}`, data);
  }

  // Mettre à jour le profil agent GP
  updateAgentProfile(agentId: number, data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}agentgp/${agentId}`, data);
  }

  // Upload logo pour agent GP
  uploadLogo(agentId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post(`${this.apiUrl}agentgp/${agentId}/logo`, formData);
  }

  // Upload carte d'identité pour agent GP
  uploadCarteIdentite(agentId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('carteIdentite', file);
    return this.http.post(`${this.apiUrl}agentgp/${agentId}/carte-identite`, formData);
  }

  // Changer le mot de passe
  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}user/${userId}/change-password`, {
      currentPassword,
      newPassword
    });
  }
}
