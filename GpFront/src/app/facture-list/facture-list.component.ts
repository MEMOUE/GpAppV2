import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, BehaviorSubject } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { CalendarModule } from 'primeng/calendar';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

import { MenuComponent } from '../menu/menu.component';
import { FactureService, FactureResponse, FactureFilter, StatutFacture, FactureStatistiques } from '../services/facture.service';

@Component({
  selector: 'app-facture-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    MenuComponent,
    ProgressSpinnerModule,
    PaginatorModule,
    CardModule,
    ToolbarModule,
    SplitButtonModule,
    CalendarModule,
    ChipModule,
    SkeletonModule,
    MenuModule,
    CheckboxModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './facture-list.component.html',
  styleUrls: ['./facture-list.component.css']
})
export class FactureListComponent implements OnInit, OnDestroy {

  // Services injectés
  private factureService = inject(FactureService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // State management
  factures: FactureResponse[] = [];
  loading = false;
  totalRecords = 0;
  statistiques: FactureStatistiques | null = null;

  // Facture courante pour les menus
  menuFacture: FactureResponse | null = null;

  // Filtres de recherche avancés
  searchTerms = {
    nomClient: '',
    numeroFacture: '',
    statut: null as StatutFacture | null,
    dateDebut: null as Date | null,
    dateFin: null as Date | null
  };

  // Filtre global
  globalFilterValue: string = '';

  // État des filtres
  hasActiveFilters = false;
  showAdvancedFilters = false;

  // Options pour les dropdowns
  statutOptions = [
    { label: 'Tous les statuts', value: null },
    { label: 'Non payée', value: 'NON_PAYEE' as StatutFacture },
    { label: 'Payée', value: 'PAYEE' as StatutFacture }
  ];

  // Options d'affichage
  rowsPerPageOptions = [12, 24, 48, 96]; // Adapté pour les cartes

  // Pagination
  first = 0;
  rows = 24; // Nombre adapté pour l'affichage en cartes

  // Tri
  sortField = 'dateCreation';
  sortOrder = -1; // DESC

  // Sélection
  selectedFactures: FactureResponse[] = [];

  // Actions groupées
  bulkActions: MenuItem[] = [
    {
      label: 'Marquer comme payées',
      icon: 'pi pi-check',
      command: () => this.marquerSelectionPayees()
    },
    {
      label: 'Exporter PDF',
      icon: 'pi pi-file-pdf',
      command: () => this.exporterSelectionPDF()
    }
  ];

  // Actions d'export
  exportActions: MenuItem[] = [
    {
      label: 'Exporter CSV',
      icon: 'pi pi-file',
      command: () => this.exportCSV()
    },
    {
      label: 'Exporter Excel',
      icon: 'pi pi-file-excel',
      command: () => this.exportExcel()
    }
  ];

  // Actions pour une facture (seront mises à jour dynamiquement)
  factureActions: MenuItem[] = [];

  // Subject pour la recherche automatique
  private searchSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private refreshSubject = new BehaviorSubject<boolean>(true);

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchSubscription();
    this.setupDataSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Charger les préférences utilisateur sauvegardées
    this.loadUserPreferences();
    // Charger les données initiales
    this.loadFactures();
  }

  private setupSearchSubscription(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.first = 0;
      this.loadFactures();
    });
  }

  private setupDataSubscriptions(): void {
    // S'abonner aux statistiques
    this.factureService.statistiques$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.statistiques = stats;
    });

    // S'abonner au loading state
    this.factureService.loading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      this.loading = loading;
    });
  }

  // Méthode appelée à chaque changement dans les champs de recherche
  onSearchChange(): void {
    this.updateFilterState();
    this.searchSubject.next();
  }

  onAdvancedSearchChange(): void {
    this.onSearchChange();
  }

  private updateFilterState(): void {
    this.hasActiveFilters = !!(
      this.searchTerms.nomClient ||
      this.searchTerms.numeroFacture ||
      this.searchTerms.statut ||
      this.searchTerms.dateDebut ||
      this.searchTerms.dateFin ||
      this.globalFilterValue
    );
  }

  // Chargement des factures avec filtres
  loadFactures(): void {
    console.log('Loading factures with params:', {
      first: this.first,
      rows: this.rows,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      globalFilter: this.globalFilterValue,
      searchTerms: this.searchTerms
    });

    const filter: FactureFilter = {
      nomClient: this.searchTerms.nomClient || undefined,
      numeroFacture: this.searchTerms.numeroFacture || undefined,
      statut: this.searchTerms.statut || undefined,
      dateDebut: this.searchTerms.dateDebut?.toISOString().split('T')[0] || undefined,
      dateFin: this.searchTerms.dateFin?.toISOString().split('T')[0] || undefined,
      globalFilter: this.globalFilterValue || undefined,
      page: Math.floor(this.first / this.rows),
      size: this.rows,
      sortBy: this.sortField,
      sortDirection: this.sortOrder === 1 ? 'ASC' : 'DESC'
    };

    this.factureService.getFacturesAgentPaginated(filter).subscribe({
      next: (response) => {
        this.factures = response.content;
        this.totalRecords = response.totalElements;
        this.selectedFactures = []; // Reset selection
        console.log('Factures loaded:', response);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des factures:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de charger les factures'
        });
        // Réinitialiser en cas d'erreur
        this.factures = [];
        this.totalRecords = 0;
      }
    });
  }

  // Gestion du filtre global
  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.globalFilterValue = target.value;
    
    this.first = 0; // Reset à la première page
    this.searchSubject.next();
  }

  // Pagination
  onPageChange(event: any): void {
    console.log('Page change event:', event);
    this.first = event.first;
    this.rows = event.rows;
    this.saveUserPreferences();
    this.loadFactures();
  }

  // Actions sur les factures
  marquerPayee(facture: FactureResponse): void {
    if (facture.statut === 'PAYEE') {
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Cette facture est déjà payée'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Confirmer le paiement de la facture ${facture.numeroFacture} ?`,
      header: 'Confirmation de paiement',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Confirmer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.factureService.marquerPayee(facture.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Facture marquée comme payée'
            });
            this.loadFactures();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: error.message || 'Impossible de mettre à jour le statut'
            });
          }
        });
      }
    });
  }

  marquerNonPayee(facture: FactureResponse): void {
    if (facture.statut === 'NON_PAYEE') {
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Cette facture est déjà marquée comme non payée'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Marquer la facture ${facture.numeroFacture} comme non payée ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.factureService.marquerNonPayee(facture.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Facture marquée comme non payée'
            });
            this.loadFactures();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: error.message || 'Impossible de mettre à jour le statut'
            });
          }
        });
      }
    });
  }

  voirDetails(facture: FactureResponse): void {
    this.messageService.add({
      severity: 'info',
      summary: `Facture ${facture.numeroFacture}`,
      detail: `Client: ${facture.nomClient} | Trajet: ${facture.depart} → ${facture.destination} | Montant: ${this.formatCurrency(facture.prixTransport)}`,
      life: 5000
    });
  }

  telechargerPDF(facture: FactureResponse): void {
    this.factureService.downloadPDF(facture.id).subscribe({
      next: (pdfBlob) => {
        this.factureService.saveFacturePDF(facture, pdfBlob);
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'PDF téléchargé avec succès'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de télécharger le PDF'
        });
      }
    });
  }

  previsualiserPDF(facture: FactureResponse): void {
    this.factureService.previewPDF(facture.id).subscribe({
      next: (pdfBlob) => {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de prévisualiser le PDF'
        });
      }
    });
  }

  async imprimerFacture(facture: FactureResponse): Promise<void> {
    try {
      await this.factureService.imprimerFacture(facture.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Impression lancée'
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: error.message || 'Impossible d\'imprimer la facture'
      });
    }
  }

  partagerWhatsApp(facture: FactureResponse): void {
    this.factureService.partagerWhatsApp(facture);
  }

  partagerEmail(facture: FactureResponse): void {
    this.factureService.partagerEmail(facture);
  }

  // Actions groupées
  marquerSelectionPayees(): void {
    if (this.selectedFactures.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune facture sélectionnée'
      });
      return;
    }

    const facturesNonPayees = this.selectedFactures.filter(f => f.statut === 'NON_PAYEE');

    if (facturesNonPayees.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Toutes les factures sélectionnées sont déjà payées'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Marquer ${facturesNonPayees.length} facture(s) comme payées ?`,
      header: 'Confirmation de paiement groupé',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.processFacturesSequentially(facturesNonPayees, 'payer');
      }
    });
  }

  exporterSelectionPDF(): void {
    if (this.selectedFactures.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune facture sélectionnée'
      });
      return;
    }

    this.selectedFactures.forEach(facture => {
      this.telechargerPDF(facture);
    });
  }

  private async processFacturesSequentially(factures: FactureResponse[], action: 'payer' | 'nonPayer'): Promise<void> {
    let success = 0;
    let errors = 0;

    for (const facture of factures) {
      try {
        if (action === 'payer') {
          await this.factureService.marquerPayee(facture.id).toPromise();
        } else {
          await this.factureService.marquerNonPayee(facture.id).toPromise();
        }
        success++;
      } catch (error) {
        errors++;
        console.error(`Erreur pour la facture ${facture.numeroFacture}:`, error);
      }
    }

    this.messageService.add({
      severity: errors === 0 ? 'success' : 'warn',
      summary: errors === 0 ? 'Succès' : 'Traitement terminé avec erreurs',
      detail: `${success} facture(s) traitée(s) avec succès${errors > 0 ? `, ${errors} erreur(s)` : ''}`
    });

    this.loadFactures();
  }

  // Gestion des filtres
  clearFilters(): void {
    this.searchTerms = {
      nomClient: '',
      numeroFacture: '',
      statut: null,
      dateDebut: null,
      dateFin: null
    };

    this.globalFilterValue = '';
    this.first = 0;
    this.updateFilterState();
    this.loadFactures();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Gestion des préférences utilisateur
  private saveUserPreferences(): void {
    const preferences = {
      rows: this.rows
    };
    localStorage.setItem('facture-list-preferences', JSON.stringify(preferences));
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem('facture-list-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        this.rows = preferences.rows || 24;
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    }
  }

  // Navigation
  creerNouvelleFacture(): void {
    this.router.navigate(['/facture']);
  }

  // Refresh
  refreshData(): void {
    this.factureService.loadStatistiques();
    this.loadFactures();
  }

  // Helpers pour l'affichage
  getStatutSeverity(statut: StatutFacture): 'success' | 'warning' | 'info' | 'danger' {
    return this.factureService.getStatutColor(statut) as 'success' | 'warning' | 'info' | 'danger';
  }

  getStatutLabel(statut: StatutFacture): string {
    return this.factureService.getStatutLabel(statut);
  }

  getStatutIcon(statut: StatutFacture): string {
    return this.factureService.getStatutIcon(statut);
  }

  formatCurrency(amount: number): string {
    return this.factureService.formatCurrency(amount);
  }

  formatDate(date: string): string {
    return this.factureService.formatDate(date);
  }

  // Export
  exportCSV(): void {
    // Implémenter export CSV pour les cartes
    this.messageService.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Export CSV en cours de développement'
    });
  }

  exportExcel(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Export Excel en cours de développement'
    });
  }

  // Méthode pour ouvrir le menu d'actions
  openFactureMenu(event: Event, facture: FactureResponse, menu: any): void {
    this.menuFacture = facture;
    this.factureActions = this.createFactureActions(facture);
    menu.toggle(event);
  }

  // Créer les actions de menu selon le statut de la facture
  private createFactureActions(facture: FactureResponse): MenuItem[] {
    const baseActions: MenuItem[] = [
      {
        label: 'Voir détails',
        icon: 'pi pi-eye',
        command: () => this.voirDetails(facture)
      },
      {
        label: 'Prévisualiser PDF',
        icon: 'pi pi-search',
        command: () => this.previsualiserPDF(facture)
      },
      {
        label: 'Télécharger PDF',
        icon: 'pi pi-download',
        command: () => this.telechargerPDF(facture)
      },
      {
        label: 'Imprimer',
        icon: 'pi pi-print',
        command: () => this.imprimerFacture(facture)
      },
      {
        separator: true
      }
    ];

    const statusActions: MenuItem[] = [];

    if (facture.statut === 'NON_PAYEE') {
      statusActions.push({
        label: 'Marquer comme payée',
        icon: 'pi pi-check',
        command: () => this.marquerPayee(facture)
      });
    } else if (facture.statut === 'PAYEE') {
      statusActions.push({
        label: 'Marquer comme non payée',
        icon: 'pi pi-times',
        command: () => this.marquerNonPayee(facture)
      });
    }

    const shareActions: MenuItem[] = [
      {
        separator: true
      },
      {
        label: 'Partager WhatsApp',
        icon: 'pi pi-whatsapp',
        command: () => this.partagerWhatsApp(facture)
      },
      {
        label: 'Partager Email',
        icon: 'pi pi-envelope',
        command: () => this.partagerEmail(facture)
      }
    ];

    return [...baseActions, ...statusActions, ...shareActions];
  }
}