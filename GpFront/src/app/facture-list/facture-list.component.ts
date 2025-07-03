import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, combineLatest, BehaviorSubject } from 'rxjs';

// PrimeNG imports
import { TableModule, Table } from 'primeng/table';
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
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

import { MenuComponent } from '../menu/menu.component';
import { FactureService, FactureResponse, FactureFilter, StatutFacture, FactureStatistiques } from '../services/facture.service';

interface ColumnDefinition {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
  type?: 'text' | 'currency' | 'date' | 'status' | 'actions';
}

@Component({
  selector: 'app-facture-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
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
    OverlayPanelModule,
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
  @ViewChild('dt') table!: Table;
  @ViewChild('filterPanel') filterPanel!: any;

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

  // Vue d'affichage
  viewMode: 'table' | 'card' = 'table';

  // Colonnes du tableau
  columns: ColumnDefinition[] = [
    { field: 'numeroFacture', header: 'N° Facture', sortable: true, width: '150px' },
    { field: 'nomClient', header: 'Client', sortable: true },
    { field: 'depart', header: 'Départ', sortable: true, width: '120px' },
    { field: 'destination', header: 'Destination', sortable: true, width: '120px' },
    { field: 'nombreKg', header: 'Poids (KG)', sortable: true, width: '100px' },
    { field: 'prixTransport', header: 'Montant', sortable: true, width: '120px', type: 'currency' },
    { field: 'statut', header: 'Statut', sortable: true, width: '100px', type: 'status' },
    { field: 'dateCreation', header: 'Date création', sortable: true, width: '150px', type: 'date' },
    { field: 'actions', header: 'Actions', sortable: false, width: '180px', type: 'actions' }
  ];

  selectedColumns: ColumnDefinition[] = [...this.columns];

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
  rowsPerPageOptions = [10, 25, 50, 100];

  // Pagination
  first = 0;
  rows = 25;

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
      this.searchTerms.dateFin
    );
  }

  // Chargement des factures avec filtres
  loadFactures(): void {
    const filter: FactureFilter = {
      nomClient: this.searchTerms.nomClient || undefined,
      numeroFacture: this.searchTerms.numeroFacture || undefined,
      statut: this.searchTerms.statut || undefined,
      dateDebut: this.searchTerms.dateDebut?.toISOString().split('T')[0] || undefined,
      dateFin: this.searchTerms.dateFin?.toISOString().split('T')[0] || undefined,
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
      },
      error: (error) => {
        console.error('Erreur lors du chargement des factures:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de charger les factures'
        });
      }
    });
  }

  // Pagination et tri
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.saveUserPreferences();
    this.loadFactures();
  }

  onSort(event: any): void {
    this.sortField = event.field;
    this.sortOrder = event.order;
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
    // Pour l'instant, on affiche les détails via toast
    // Plus tard, on pourra créer une page de détails
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

    // Télécharger une par une
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

    if (this.table) {
      this.table.clear();
    }

    this.updateFilterState();
    this.loadFactures(); // Recharger directement au lieu d'utiliser searchSubject
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.table) {
      this.table.filterGlobal(target.value, 'contains');
    }
  }

  // Gestion de l'affichage
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'card' : 'table';
    this.saveUserPreferences();
  }

  onColumnToggle(): void {
    this.saveUserPreferences();
  }

  // Gestion des préférences utilisateur
  private saveUserPreferences(): void {
    const preferences = {
      viewMode: this.viewMode,
      rows: this.rows,
      selectedColumns: this.selectedColumns.map(col => col.field)
    };
    localStorage.setItem('facture-list-preferences', JSON.stringify(preferences));
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem('facture-list-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        this.viewMode = preferences.viewMode || 'table';
        this.rows = preferences.rows || 25;

        if (preferences.selectedColumns) {
          this.selectedColumns = this.columns.filter(col =>
            preferences.selectedColumns.includes(col.field)
          );
        }
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
    if (this.table) {
      this.table.exportCSV();
    }
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

    // Créer les actions dynamiquement selon le statut
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

    // Ajouter les actions de statut selon l'état actuel
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
