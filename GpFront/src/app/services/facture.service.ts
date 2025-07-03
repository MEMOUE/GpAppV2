import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Types correspondant au backend
export type StatutFacture = 'NON_PAYEE' | 'PAYEE';

export interface FactureCreateRequest {
  programmeId: number;
  nomClient: string;
  adresseClient: string;
  laveurBagage: string;
  nombreKg: number;
  prixTransport: number;
  signatureBase64?: string;
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
  numeroFacture?: string;
  statut?: StatutFacture;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export interface FactureStatistiques {
  totalFactures: number;
  nombreFactures: number;
  nombreFacturesPayees: number;
  pourcentagePayees: number;
}

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private readonly apiUrl = `${environment.apiUrl}api/factures`;
  private http = inject(HttpClient);

  // State management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private statistiquesSubject = new BehaviorSubject<FactureStatistiques | null>(null);
  private facturesSubject = new BehaviorSubject<FactureResponse[]>([]);

  // Observables publics
  loading$ = this.loadingSubject.asObservable();
  statistiques$ = this.statistiquesSubject.asObservable();
  factures$ = this.facturesSubject.asObservable();

  constructor() {
    this.loadStatistiques();
  }

  // Créer une facture
  creerFacture(facture: FactureCreateRequest): Observable<FactureResponse> {
    this.setLoading(true);

    return this.http.post<FactureResponse>(this.apiUrl, facture).pipe(
      tap(() => {
        this.loadStatistiques(); // Rafraîchir les statistiques
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  // Récupérer les factures de l'agent connecté
  getFacturesAgent(): Observable<FactureResponse[]> {
    this.setLoading(true);

    return this.http.get<FactureResponse[]>(this.apiUrl).pipe(
      tap(factures => {
        this.facturesSubject.next(factures);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  // Récupérer les factures avec pagination et filtres
  getFacturesAgentPaginated(filter: FactureFilter): Observable<PageResponse<FactureResponse>> {
    this.setLoading(true);

    let params = new HttpParams();

    if (filter.nomClient) params = params.set('nomClient', filter.nomClient);
    if (filter.numeroFacture) params = params.set('numeroFacture', filter.numeroFacture);
    if (filter.statut) params = params.set('statut', filter.statut);
    if (filter.dateDebut) params = params.set('dateDebut', filter.dateDebut);
    if (filter.dateFin) params = params.set('dateFin', filter.dateFin);
    if (filter.page !== undefined) params = params.set('page', filter.page.toString());
    if (filter.size !== undefined) params = params.set('size', filter.size.toString());
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);

    return this.http.get<PageResponse<FactureResponse>>(`${this.apiUrl}/paginated`, { params }).pipe(
      tap(response => {
        this.facturesSubject.next(response.content);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  // Récupérer une facture par ID
  getFactureById(id: number): Observable<FactureResponse> {
    return this.http.get<FactureResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Marquer une facture comme payée
  marquerPayee(id: number): Observable<FactureResponse> {
    return this.http.post<FactureResponse>(`${this.apiUrl}/${id}/payer`, {}).pipe(
      tap(() => this.loadStatistiques()),
      catchError(error => this.handleError(error))
    );
  }

  // Changer le statut d'une facture
  changerStatut(id: number, statut: StatutFacture): Observable<FactureResponse> {
    const body = { statut: statut };

    return this.http.put<FactureResponse>(`${this.apiUrl}/${id}/statut`, body).pipe(
      tap(() => this.loadStatistiques()),
      catchError(error => this.handleError(error))
    );
  }

  // Méthode helper pour marquer comme non payée
  marquerNonPayee(id: number): Observable<FactureResponse> {
    return this.changerStatut(id, 'NON_PAYEE');
  }

  // Télécharger le PDF d'une facture
  downloadPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Prévisualiser le PDF d'une facture
  previewPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf/preview`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Récupérer les statistiques
  getStatistiques(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistiques`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Charger les statistiques
  loadStatistiques(): void {
    this.getStatistiques().subscribe({
      next: (stats) => {
        const formattedStats: FactureStatistiques = {
          totalFactures: stats.totalFactures || 0,
          nombreFactures: stats.nombreFactures || 0,
          nombreFacturesPayees: stats.nombreFacturesPayees || 0,
          pourcentagePayees: stats.nombreFactures > 0
            ? Math.round((stats.nombreFacturesPayees / stats.nombreFactures) * 100)
            : 0
        };
        this.statistiquesSubject.next(formattedStats);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.statistiquesSubject.next({
          totalFactures: 0,
          nombreFactures: 0,
          nombreFacturesPayees: 0,
          pourcentagePayees: 0
        });
      }
    });
  }

  // Utilitaires pour l'affichage
  getStatutLabel(statut: StatutFacture): string {
    switch (statut) {
      case 'PAYEE': return 'Payée';
      case 'NON_PAYEE': return 'Non payée';
      default: return statut;
    }
  }

  getStatutColor(statut: StatutFacture): string {
    switch (statut) {
      case 'PAYEE': return 'success';
      case 'NON_PAYEE': return 'warning';
      default: return 'info';
    }
  }

  getStatutIcon(statut: StatutFacture): string {
    switch (statut) {
      case 'PAYEE': return 'pi pi-check-circle';
      case 'NON_PAYEE': return 'pi pi-clock';
      default: return 'pi pi-info-circle';
    }
  }

  // Utilitaires pour l'export et le partage
  saveFacturePDF(facture: FactureResponse, pdfBlob: Blob): void {
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Facture_${facture.numeroFacture}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async imprimerFacture(id: number): Promise<void> {
    try {
      const pdfBlob = await this.downloadPDF(id).toPromise();
      if (pdfBlob) {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
            printWindow.onafterprint = () => {
              printWindow.close();
              URL.revokeObjectURL(pdfUrl);
            };
          };
        }
      }
    } catch (error) {
      throw new Error('Erreur lors de l\'impression de la facture');
    }
  }

  partagerWhatsApp(facture: FactureResponse): void {
    const message = `Facture ${facture.numeroFacture}\n` +
      `Client: ${facture.nomClient}\n` +
      `Montant: ${this.formatCurrency(facture.prixTransport)}\n` +
      `Trajet: ${facture.depart} → ${facture.destination}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  partagerEmail(facture: FactureResponse): void {
    const subject = `Facture ${facture.numeroFacture}`;
    const body = `Bonjour,\n\n` +
      `Veuillez trouver ci-joint la facture ${facture.numeroFacture}.\n\n` +
      `Détails:\n` +
      `- Client: ${facture.nomClient}\n` +
      `- Montant: ${this.formatCurrency(facture.prixTransport)}\n` +
      `- Trajet: ${facture.depart} → ${facture.destination}\n` +
      `- Date: ${this.formatDate(facture.dateCreation)}\n\n` +
      `Cordialement,\n` +
      `${facture.agentAgence}`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // Gestion des erreurs
  private handleError(error: any): Observable<never> {
    console.error('Erreur dans FactureService:', error);

    let errorMessage = 'Une erreur inattendue s\'est produite';

    if (error.status === 400) {
      errorMessage = error.error?.message || 'Données invalides';
    } else if (error.status === 401) {
      errorMessage = 'Accès non autorisé';
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit';
    } else if (error.status === 404) {
      errorMessage = 'Ressource non trouvée';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur interne';
    }

    return throwError(() => new Error(errorMessage));
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
