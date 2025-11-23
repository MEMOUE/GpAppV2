import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Programmegp } from '../model/Programmegp';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueService {
  private apiUrl = `${environment.apiUrl}programmegp`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les programmes de l'agent connecté
  getMesProgrammes(): Observable<Programmegp[]> {
    return this.http.get<Programmegp[]>(`${this.apiUrl}/mylist`);
  }

  // Récupérer un programme par ID
  getProgrammeById(id: number): Observable<Programmegp> {
    return this.http.get<Programmegp>(`${this.apiUrl}/${id}`);
  }

  // Mettre à jour un programme
  updateProgramme(id: number, programme: Programmegp): Observable<Programmegp> {
    return this.http.put<Programmegp>(`${this.apiUrl}/${id}`, programme);
  }

  // Supprimer un programme
  deleteProgramme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Vérifier si un programme est expiré
  isProgrammeExpire(dateline: Date): boolean {
    const today = new Date();
    const programmeDate = new Date(dateline);
    return programmeDate < today;
  }

  // Calculer le nombre de jours restants
  getJoursRestants(dateline: Date): number {
    const today = new Date();
    const programmeDate = new Date(dateline);
    const diffTime = programmeDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Obtenir le statut d'un programme
  getStatutProgramme(dateline: Date): 'actif' | 'expire-bientot' | 'expire' {
    const joursRestants = this.getJoursRestants(dateline);

    if (joursRestants < 0) {
      return 'expire';
    } else if (joursRestants <= 3) {
      return 'expire-bientot';
    } else {
      return 'actif';
    }
  }
}
