import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../environments/environment';

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

      // Vérifier si la géolocalisation est activée
      const userLocation = await this.getUserLocation();

      return {
        ip: ip,
        latitude: userLocation.latitude ?? locationData.lat,
        longitude: userLocation.longitude ?? locationData.lon,
        country: locationData.country,
        city: locationData.city
      };
    } catch (error) {
      return {
        ip: 'IP non disponible',
        latitude: null,
        longitude: null,
        country: 'Inconnu',
        city: 'Inconnu'
      };
    }
  }

  getUserLocation(): Promise<any> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          () => resolve({ latitude: null, longitude: null }) // En cas de refus d'accès à la géolocalisation
        );
      } else {
        resolve({ latitude: null, longitude: null });
      }
    });
  }

  async trackUserAction(page: string) {
    const userData = await this.getUserData();

    const trackingData = {
      ip: userData.ip,
      latitude: userData.latitude,
      longitude: userData.longitude,
      country: userData.country,
      city: userData.city,
      page: page,
      timestamp: new Date()
    };

    // Envoi des données au backend Spring Boot
    this.http.post(this.trackingUrl, trackingData).subscribe();
  }
}
