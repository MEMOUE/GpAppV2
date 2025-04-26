import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private trackingUrl = `${environment.apiUrl}tracking`; // URL du backend

  constructor(private http: HttpClient) {}

  async getUserData(): Promise<any> {
    try {
      // Obtenir l'adresse IP publique
      const ipData = await firstValueFrom(this.http.get<any>('https://api64.ipify.org?format=json'));
      const ip = ipData.ip;

      // Obtenir les informations de localisation basées sur l'IP
      const locationData = await firstValueFrom(this.http.get<any>(`http://ip-api.com/json/${ip}`));

      return {
        ip: ip,
        country: locationData.country,
        city: locationData.city
      };
    } catch (error) {
      return {
        ip: 'IP non disponible',
        country: 'Inconnu',
        city: 'Inconnu'
      };
    }
  }

  // Suppression de la méthode getUserLocation() qui n'est plus nécessaire

  async trackUserAction(page: string) {
    const userData = await this.getUserData();

    const trackingData = {
      ip: userData.ip,
      country: userData.country,
      city: userData.city,
      page: page,
      timestamp: new Date()
    };

    // Envoi des données au backend Spring Boot
    this.http.post(this.trackingUrl, trackingData).subscribe();
  }
}
