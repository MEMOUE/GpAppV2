import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, BehaviorSubject, combineLatest } from 'rxjs';

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
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';

import { MenuComponent } from '../menu/menu.component';
import { FactureService, FactureResponse, FactureFilter, StatutFacture, FactureStatistiques } from '../services/facture.service';

// Interface pour les options de dropdown
interface DropdownOption {
  label: string;
  value: any;
}

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
    TooltipModule,
    DividerModule,
    BadgeModule
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
  private cdr = inject(ChangeDetectorRef);

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
  activeFiltersCount = 0;

  // Options pour les dropdowns
  statutOptions: DropdownOption[] = [
    { label: 'Tous les statuts', value: null },
    { label: 'Non payée', value: 'NON_PAYEE' as StatutFacture },
    { label: 'Payée', value: 'PAYEE' as StatutFacture }
  ];

  // Options d'affichage
  rowsPerPageOptions = [12, 24, 48, 96];

  // Pagination
  first = 0;
  rows = 24;

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
      label: 'Marquer comme non payées',
      icon: 'pi pi-times',
      command: () => this.marquerSelectionNonPayees()
    },
    {
      separator: true
    },
    {
      label: 'Exporter PDF sélectionnées',
      icon: 'pi pi-file-pdf',
      command: () => this.exporterSelectionPDF()
    }
  ];

  // Actions d'export
  exportActions: MenuItem[] = [
    {
      label: 'Exporter toutes en CSV',
      icon: 'pi pi-file',
      command: () => this.exportCSV()
    },
    {
      label: 'Exporter toutes en Excel',
      icon: 'pi pi-file-excel',
      command: () => this.exportExcel()
    },
    {
      separator: true
    },
    {
      label: 'Exporter les factures payées',
      icon: 'pi pi-check-circle',
      command: () => this.exportPayedInvoices()
    },
    {
      label: 'Exporter les factures en attente',
      icon: 'pi pi-clock',
      command: () => this.exportPendingInvoices()
    }
  ];

  // Actions pour une facture (seront mises à jour dynamiquement)
  factureActions: MenuItem[] = [];

  // Subject pour la recherche automatique
  private searchSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private refreshSubject = new BehaviorSubject<boolean>(true);

  // État de chargement initial
  initialLoading = true;

  // Métriques calculées
  computedMetrics = {
    tauxPaiement: 0,
    facturesRecentes: 0,
    moyenneMontant: '0 €'
  };

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INITIALIZATION =====

  private initializeComponent(): void {
    this.loadUserPreferences();
    this.setupSearchSubscription();
  }

  private setupSubscriptions(): void {
    // S'abonner aux statistiques du service
    this.factureService.statistiques$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.statistiques = stats;
      this.calculateComputedMetrics();
      this.cdr.detectChanges();
    });

    // S'abonner au loading state du service
    this.factureService.loading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      this.loading = loading;
      this.cdr.detectChanges();
    });

    // S'abonner aux factures du service
    this.factureService.factures$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(factures => {
      this.factures = factures;
      this.calculateComputedMetrics();
      this.cdr.detectChanges();
    });
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

  private loadInitialData(): void {
    this.initialLoading = true;

    // Charger les statistiques en premier
    this.factureService.loadStatistiques();

    // Puis charger les factures
    this.loadFactures().finally(() => {
      this.initialLoading = false;
    });
  }

  // ===== DATA LOADING =====

  loadFactures(): Promise<void> {
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

    return new Promise((resolve, reject) => {
      this.factureService.getFacturesAgentPaginated(filter).subscribe({
        next: (response) => {
          this.factures = response.content;
          this.totalRecords = response.totalElements;
          this.selectedFactures = []; // Reset selection
          this.calculateComputedMetrics();

          console.log('Factures loaded:', response);

          if (response.content.length === 0 && this.first > 0) {
            // Si on a navigué vers une page vide, retourner à la première page
            this.first = 0;
            this.loadFactures().then(resolve).catch(reject);
          } else {
            resolve();
          }
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
          this.selectedFactures = [];
          reject(error);
        }
      });
    });
  }

  // ===== SEARCH AND FILTERS =====

  onSearchChange(): void {
    this.updateFilterState();
    this.searchSubject.next();
  }

  onAdvancedSearchChange(): void {
    this.onSearchChange();
  }

  applyGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.globalFilterValue = target.value;

    this.first = 0;
    this.searchSubject.next();
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

    // Compter les filtres actifs
    this.activeFiltersCount = 0;
    if (this.searchTerms.nomClient) this.activeFiltersCount++;
    if (this.searchTerms.numeroFacture) this.activeFiltersCount++;
    if (this.searchTerms.statut) this.activeFiltersCount++;
    if (this.searchTerms.dateDebut) this.activeFiltersCount++;
    if (this.searchTerms.dateFin) this.activeFiltersCount++;
    if (this.globalFilterValue) this.activeFiltersCount++;
  }

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

    this.messageService.add({
      severity: 'info',
      summary: 'Filtres effacés',
      detail: 'Tous les filtres ont été réinitialisés',
      life: 3000
    });
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // ===== PAGINATION =====

  onPageChange(event: any): void {
    console.log('Page change event:', event);
    this.first = event.first;
    this.rows = event.rows;
    this.saveUserPreferences();
    this.loadFactures();
  }

  // ===== INVOICE ACTIONS =====

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
      detail: `Client: ${facture.nomClient} | Trajet: ${facture.depart} → ${facture.destination} | Montant: ${facture.prixTransport}`,
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

  // ===== SHARING ACTIONS =====

  partagerWhatsApp(facture: FactureResponse): void {
    const message = `Facture ${facture.numeroFacture}\n` +
      `Client: ${facture.nomClient}\n` +
      `Montant: ${facture.prixTransport}\n` +
      `Trajet: ${facture.depart} → ${facture.destination}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    this.messageService.add({
      severity: 'info',
      summary: 'Partage WhatsApp',
      detail: 'Lien WhatsApp ouvert'
    });
  }

  partagerEmail(facture: FactureResponse): void {
    const subject = `Facture ${facture.numeroFacture}`;
    const body = `Bonjour,\n\n` +
      `Veuillez trouver ci-joint la facture ${facture.numeroFacture}.\n\n` +
      `Détails:\n` +
      `- Client: ${facture.nomClient}\n` +
      `- Montant: ${facture.prixTransport}\n` +
      `- Trajet: ${facture.depart} → ${facture.destination}\n` +
      `- Date: ${this.formatDate(facture.dateCreation)}\n\n` +
      `Cordialement,\n` +
      `${facture.agentAgence}`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    this.messageService.add({
      severity: 'info',
      summary: 'Partage Email',
      detail: 'Client email ouvert'
    });
  }

  // ===== BULK ACTIONS =====

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

  marquerSelectionNonPayees(): void {
    if (this.selectedFactures.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune facture sélectionnée'
      });
      return;
    }

    const facturesPayees = this.selectedFactures.filter(f => f.statut === 'PAYEE');

    if (facturesPayees.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Toutes les factures sélectionnées sont déjà non payées'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Marquer ${facturesPayees.length} facture(s) comme non payées ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.processFacturesSequentially(facturesPayees, 'nonPayer');
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

    const progressMessage = this.messageService.add({
      severity: 'info',
      summary: 'Export en cours',
      detail: `Téléchargement de ${this.selectedFactures.length} facture(s)...`,
      life: 0
    });

    let completed = 0;
    this.selectedFactures.forEach((facture, index) => {
      setTimeout(() => {
        this.telechargerPDF(facture);
        completed++;

        if (completed === this.selectedFactures.length) {
          this.messageService.clear();
          this.messageService.add({
            severity: 'success',
            summary: 'Export terminé',
            detail: `${completed} facture(s) téléchargée(s)`
          });
        }
      }, index * 500); // Délai entre chaque téléchargement
    });
  }

  private async processFacturesSequentially(factures: FactureResponse[], action: 'payer' | 'nonPayer'): Promise<void> {
    let success = 0;
    let errors = 0;

    const totalFactures = factures.length;
    let processed = 0;

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

      processed++;

      // Afficher le progrès
      if (processed % 5 === 0 || processed === totalFactures) {
        this.messageService.add({
          severity: 'info',
          summary: 'Progression',
          detail: `${processed}/${totalFactures} factures traitées`,
          life: 2000
        });
      }
    }

    this.messageService.add({
      severity: errors === 0 ? 'success' : 'warn',
      summary: errors === 0 ? 'Succès' : 'Traitement terminé avec erreurs',
      detail: `${success} facture(s) traitée(s) avec succès${errors > 0 ? `, ${errors} erreur(s)` : ''}`,
      life: 6000
    });

    this.selectedFactures = [];
    this.loadFactures();
  }

  // ===== EXPORT ACTIONS =====

  exportCSV(): void {
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

  exportPayedInvoices(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Export des factures payées en cours de développement'
    });
  }

  exportPendingInvoices(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Export des factures en attente en cours de développement'
    });
  }

  // ===== MENU ACTIONS =====

  openFactureMenu(event: Event, facture: FactureResponse, menu: any): void {
    this.menuFacture = facture;
    this.factureActions = this.createFactureActions(facture);
    menu.toggle(event);
  }

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

  // ===== NAVIGATION =====

  creerNouvelleFacture(): void {
    this.router.navigate(['/facture']);
  }

  refreshData(): void {
    this.factureService.loadStatistiques();
    this.loadFactures();

    this.messageService.add({
      severity: 'info',
      summary: 'Actualisation',
      detail: 'Données actualisées',
      life: 2000
    });
  }

  // ===== UTILITIES =====

  private calculateComputedMetrics(): void {
    if (this.statistiques) {
      this.computedMetrics.tauxPaiement = this.statistiques.pourcentagePayees;

      // Calculer les factures récentes (derniers 7 jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      this.computedMetrics.facturesRecentes = this.factures.filter(f =>
        new Date(f.dateCreation) > sevenDaysAgo
      ).length;

      // Calculer la moyenne des montants
      if (this.factures.length > 0) {
        const totalNumerique = this.factures.reduce((sum, facture) => {
          return sum + this.factureService.extractNumericalValue(facture.prixTransport);
        }, 0);

        const moyenne = totalNumerique / this.factures.length;
        const devise = this.factures.length > 0 ?
          this.factureService.extractDevise(this.factures[0].prixTransport) || '€' : '€';

        this.computedMetrics.moyenneMontant = `${moyenne.toFixed(2)} ${devise}`;
      }
    }
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

  // Méthode simplifiée car le prix contient déjà la devise
  formatCurrency(prix: string): string {
    return this.factureService.formatPrix(prix);
  }

  formatDate(date: string): string {
    return this.factureService.formatDate(date);
  }

  formatDateTime(date: string): string {
    return this.factureService.formatDate(date);
  }

  // Méthode pour extraire la valeur numérique (utile pour les calculs/comparaisons)
  getPrixNumerique(prix: string): number {
    return this.factureService.extractNumericalValue(prix);
  }

  // Méthode pour comparer les prix (utile pour le tri)
  comparerPrix(facture1: FactureResponse, facture2: FactureResponse): number {
    return this.factureService.comparePrix(facture1.prixTransport, facture2.prixTransport);
  }

  // ===== USER PREFERENCES =====

  private saveUserPreferences(): void {
    const preferences = {
      rows: this.rows,
      showAdvancedFilters: this.showAdvancedFilters
    };
    localStorage.setItem('facture-list-preferences', JSON.stringify(preferences));
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem('facture-list-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        this.rows = preferences.rows || 24;
        this.showAdvancedFilters = preferences.showAdvancedFilters || false;
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    }
  }

  // ===== GETTERS =====

  get hasFactures(): boolean {
    return this.factures.length > 0;
  }

  get hasSelection(): boolean {
    return this.selectedFactures.length > 0;
  }

  get isAllSelected(): boolean {
    return this.factures.length > 0 && this.selectedFactures.length === this.factures.length;
  }

  get isPartiallySelected(): boolean {
    return this.selectedFactures.length > 0 && this.selectedFactures.length < this.factures.length;
  }

  get canPerformBulkActions(): boolean {
    return this.hasSelection && !this.loading;
  }

  get displayedRange(): string {
    if (this.totalRecords === 0) return '0 - 0 de 0';

    const start = this.first + 1;
    const end = Math.min(this.first + this.rows, this.totalRecords);

    return `${start} - ${end} de ${this.totalRecords}`;
  }

  get currentPage(): number {
    return Math.floor(this.first / this.rows) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.rows);
  }

  // Sélection globale
  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedFactures = [];
    } else {
      this.selectedFactures = [...this.factures];
    }
  }
}
