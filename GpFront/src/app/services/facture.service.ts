import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap, retry, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Types pour les états simplifiés
export type StatutFacture = 'NON_PAYEE' | 'PAYEE';

export interface FactureCreateRequest {
  programmeId: number;
  nomClient: string;
  adresseClient: string;
  laveurBagage: string;
  nombreKg: number;
  prixTransport: number;
  signatureBase64: string;
  notes?: string;
}

export interface FactureResponse {
  id: number;
  numeroFacture: string;
  nomClient: string;
  adresseClient: string;
  laveurBagage: string;
  nombreKg: number;
  prixTransport: number;
  prixUnitaire: number;
  dateCreation: string;
  statut: StatutFacture;
  notes?: string;
  datePayement?: string;

  // Informations du programme
  programmeId: number;
  programmeDescription: string;
  depart: string;
  destination: string;
  garantie: string;

  // Informations de l'agent
  agentId: number;
  agentNom: string;
  agentAgence: string;
  agentTelephone: string;
  agentAdresse: string;
  agentEmail: string;
}

export interface FactureFilter {
  nomClient?: string;
  statut?: StatutFacture;
  dateDebut?: string;
  dateFin?: string;
  numeroFacture?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface FactureStatistiques {
  totalFactures: number;
  nombreFactures: number;
  nombreFacturesPayees: number;
  pourcentagePayees: number;
  chiffreAffaireMensuel: number;
}

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private readonly apiUrl = `${environment.apiUrl}factures`;
  private readonly retryCount = 3;

  // State management
  private facturesSubject = new BehaviorSubject<FactureResponse[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private statistiquesSubject = new BehaviorSubject<FactureStatistiques | null>(null);

  public factures$ = this.facturesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public statistiques$ = this.statistiquesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStatistiques();
  }

  // Créer une facture avec gestion d'erreur améliorée
  creerFacture(facture: FactureCreateRequest): Observable<FactureResponse> {
    this.setLoading(true);

    return this.http.post<FactureResponse>(this.apiUrl, facture).pipe(
      retry(this.retryCount),
      tap((response) => {
        this.addFactureToCache(response);
        this.loadStatistiques(); // Refresh stats
      }),
      catchError(this.handleError('Erreur lors de la création de la facture')),
      finalize(() => this.setLoading(false))
    );
  }

  // Lister les factures avec cache
  getFacturesAgent(forceRefresh = false): Observable<FactureResponse[]> {
    if (!forceRefresh && this.facturesSubject.value.length > 0) {
      return of(this.facturesSubject.value);
    }

    this.setLoading(true);

    return this.http.get<FactureResponse[]>(this.apiUrl).pipe(
      retry(this.retryCount),
      tap((factures) => {
        this.facturesSubject.next(factures);
      }),
      catchError(this.handleError('Erreur lors du chargement des factures')),
      finalize(() => this.setLoading(false))
    );
  }

  // Lister les factures avec pagination améliorée
  getFacturesAgentPaginated(filter: FactureFilter): Observable<PaginatedResponse<FactureResponse>> {
    this.setLoading(true);

    let params = new HttpParams();

    // Construction des paramètres de manière plus propre
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.append(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<FactureResponse>>(`${this.apiUrl}/paginated`, { params }).pipe(
      retry(this.retryCount),
      catchError(this.handleError('Erreur lors du chargement des factures paginées')),
      finalize(() => this.setLoading(false))
    );
  }

  // Récupérer une facture par ID avec cache
  getFactureById(id: number): Observable<FactureResponse> {
    // Vérifier d'abord le cache
    const cachedFacture = this.facturesSubject.value.find(f => f.id === id);
    if (cachedFacture) {
      return of(cachedFacture);
    }

    return this.http.get<FactureResponse>(`${this.apiUrl}/${id}`).pipe(
      retry(this.retryCount),
      tap((facture) => {
        this.updateFactureInCache(facture);
      }),
      catchError(this.handleError(`Erreur lors du chargement de la facture ${id}`))
    );
  }

  // Marquer comme payée avec optimistic update
  marquerPayee(id: number): Observable<FactureResponse> {
    // Optimistic update
    this.updateFactureStatusInCache(id, 'PAYEE');

    return this.http.post<FactureResponse>(`${this.apiUrl}/${id}/payer`, {}).pipe(
      retry(this.retryCount),
      tap((response) => {
        this.updateFactureInCache(response);
        this.loadStatistiques(); // Refresh stats
      }),
      catchError((error) => {
        // Revert optimistic update on error
        this.updateFactureStatusInCache(id, 'NON_PAYEE');
        return this.handleError('Erreur lors du marquage comme payée')(error);
      })
    );
  }

  // Marquer comme non payée avec optimistic update
  marquerNonPayee(id: number): Observable<FactureResponse> {
    // Optimistic update
    this.updateFactureStatusInCache(id, 'NON_PAYEE');

    return this.http.put<FactureResponse>(`${this.apiUrl}/${id}/statut`, { statut: 'NON_PAYEE' }).pipe(
      retry(this.retryCount),
      tap((response) => {
        this.updateFactureInCache(response);
        this.loadStatistiques(); // Refresh stats
      }),
      catchError((error) => {
        // Revert optimistic update on error
        this.updateFactureStatusInCache(id, 'PAYEE');
        return this.handleError('Erreur lors du marquage comme non payée')(error);
      })
    );
  }

  // Télécharger PDF avec gestion d'erreur
  downloadPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' }).pipe(
      retry(this.retryCount),
      catchError(this.handleError('Erreur lors du téléchargement du PDF'))
    );
  }

  // Prévisualiser PDF
  previewPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf/preview`, { responseType: 'blob' }).pipe(
      retry(this.retryCount),
      catchError(this.handleError('Erreur lors de la prévisualisation du PDF'))
    );
  }

  // Charger les statistiques
  loadStatistiques(): void {
    this.http.get<FactureStatistiques>(`${this.apiUrl}/statistiques`).pipe(
      map(stats => ({
        ...stats,
        pourcentagePayees: stats.nombreFactures > 0
          ? Math.round((stats.nombreFacturesPayees / stats.nombreFactures) * 100)
          : 0
      })),
      catchError(() => of(null))
    ).subscribe(stats => {
      this.statistiquesSubject.next(stats);
    });
  }

  // Utilitaires améliorés
  saveFacturePDF(facture: FactureResponse, pdfBlob: Blob): void {
    try {
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${facture.numeroFacture}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw new Error('Impossible de télécharger le fichier');
    }
  }

  async imprimerFacture(id: number): Promise<void> {
    try {
      const pdfBlob = await this.previewPDF(id).toPromise();
      if (!pdfBlob) {
        throw new Error('Impossible de charger le PDF');
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;

      return new Promise((resolve, reject) => {
        iframe.onload = () => {
          try {
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
              window.URL.revokeObjectURL(url);
              resolve();
            }, 1000);
          } catch (error) {
            reject(error);
          }
        };

        iframe.onerror = () => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
          reject(new Error('Erreur lors du chargement du PDF'));
        };

        document.body.appendChild(iframe);
      });
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      throw error;
    }
  }

  partagerWhatsApp(facture: FactureResponse): void {
    const message = `🧾 Facture ${facture.numeroFacture}
👤 Client: ${facture.nomClient}
💰 Montant: ${facture.prixTransport}€
📍 Trajet: ${facture.depart} → ${facture.destination}
📦 Poids: ${facture.nombreKg} KG`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  partagerEmail(facture: FactureResponse): void {
    const subject = `Facture ${facture.numeroFacture} - ${facture.nomClient}`;
    const body = `Bonjour,

Veuillez trouver ci-joint les détails de la facture ${facture.numeroFacture}.

Détails de la facture:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Client: ${facture.nomClient}
• Adresse: ${facture.adresseClient}
• Montant: ${facture.prixTransport}€
• Poids: ${facture.nombreKg} KG
• Prix unitaire: ${facture.prixUnitaire}€/KG
• Trajet: ${facture.depart} → ${facture.destination}
• Statut: ${this.getStatutLabel(facture.statut)}
• Date de création: ${new Date(facture.dateCreation).toLocaleDateString('fr-FR')}

Agence: ${facture.agentAgence}
Téléphone: ${facture.agentTelephone}

Cordialement,
L'équipe GPMonde`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  }

  // Helpers pour l'affichage améliorés
  getStatutColor(statut: StatutFacture): string {
    const colors = {
      'PAYEE': 'success',
      'NON_PAYEE': 'warning'
    };
    return colors[statut] || 'secondary';
  }

  getStatutLabel(statut: StatutFacture): string {
    const labels = {
      'PAYEE': 'Payée',
      'NON_PAYEE': 'Non payée'
    };
    return labels[statut] || statut;
  }

  getStatutIcon(statut: StatutFacture): string {
    const icons = {
      'PAYEE': 'pi pi-check-circle',
      'NON_PAYEE': 'pi pi-clock'
    };
    return icons[statut] || 'pi pi-question-circle';
  }

  // Méthodes de cache privées
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private addFactureToCache(facture: FactureResponse): void {
    const currentFactures = this.facturesSubject.value;
    this.facturesSubject.next([facture, ...currentFactures]);
  }

  private updateFactureInCache(updatedFacture: FactureResponse): void {
    const currentFactures = this.facturesSubject.value;
    const index = currentFactures.findIndex(f => f.id === updatedFacture.id);

    if (index !== -1) {
      const newFactures = [...currentFactures];
      newFactures[index] = updatedFacture;
      this.facturesSubject.next(newFactures);
    }
  }

  private updateFactureStatusInCache(id: number, statut: StatutFacture): void {
    const currentFactures = this.facturesSubject.value;
    const facture = currentFactures.find(f => f.id === id);

    if (facture) {
      const updatedFacture = { ...facture, statut };
      this.updateFactureInCache(updatedFacture);
    }
  }

  // Gestion d'erreur centralisée
  private handleError(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`${operation} failed:`, error);

      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        // Erreur côté client
        errorMessage = `Erreur: ${error.error.message}`;
      } else {
        // Erreur côté serveur
        switch (error.status) {
          case 400:
            errorMessage = 'Données invalides';
            break;
          case 401:
            errorMessage = 'Non autorisé - Veuillez vous reconnecter';
            break;
          case 403:
            errorMessage = 'Accès interdit';
            break;
          case 404:
            errorMessage = 'Ressource non trouvée';
            break;
          case 500:
            errorMessage = 'Erreur serveur interne';
            break;
          default:
            errorMessage = error.error?.message || errorMessage;
        }
      }

      return throwError(() => new Error(errorMessage));
    };
  }

  // Méthodes utilitaires
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Nettoyage des ressources
  destroy(): void {
    this.facturesSubject.complete();
    this.loadingSubject.complete();
    this.statistiquesSubject.complete();
  }
}
