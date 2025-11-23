import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateModule } from '@ngx-translate/core';
import { HistoriqueService } from '../services/historique.service';
import { Programmegp } from '../model/Programmegp';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    CalendarModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    CardModule,
    BadgeModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './historique.component.html',
  styleUrl: './historique.component.css'
})
export class HistoriqueComponent implements OnInit {
  programmes: Programmegp[] = [];
  filteredProgrammes: Programmegp[] = [];
  loading: boolean = false;

  // Dialog d'édition
  displayEditDialog: boolean = false;
  selectedProgramme: Programmegp | null = null;
  editedProgramme: Programmegp = this.getEmptyProgramme();

  // Filtres
  searchText: string = '';
  filterStatus: 'tous' | 'actif' | 'expire-bientot' | 'expire' = 'tous';

  // Pour le calendrier
  minDate: Date = new Date();

  // Statistiques
  stats = {
    total: 0,
    actifs: 0,
    expiresBientot: 0,
    expires: 0
  };

  constructor(
    private historiqueService: HistoriqueService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadProgrammes();
  }

  loadProgrammes(): void {
    this.loading = true;
    this.historiqueService.getMesProgrammes().subscribe({
      next: (data) => {
        this.programmes = data;
        this.applyFilters();
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger l\'historique des programmes'
        });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.programmes];

    // Filtre par texte de recherche
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(p =>
        p.description?.toLowerCase().includes(search) ||
        p.depart?.toLowerCase().includes(search) ||
        p.destination?.toLowerCase().includes(search)
      );
    }

    // Filtre par statut
    if (this.filterStatus !== 'tous') {
      filtered = filtered.filter(p => {
        const dateline = typeof p.dateline === 'string' ? new Date(p.dateline) : p.dateline;
        const statut = this.getStatutProgramme(dateline);
        return statut === this.filterStatus;
      });
    }

    this.filteredProgrammes = filtered;
  }

  calculateStats(): void {
    this.stats.total = this.programmes.length;
    this.stats.actifs = 0;
    this.stats.expiresBientot = 0;
    this.stats.expires = 0;

    this.programmes.forEach(p => {
      const dateline = typeof p.dateline === 'string' ? new Date(p.dateline) : p.dateline;
      const statut = this.getStatutProgramme(dateline);
      switch (statut) {
        case 'actif':
          this.stats.actifs++;
          break;
        case 'expire-bientot':
          this.stats.expiresBientot++;
          break;
        case 'expire':
          this.stats.expires++;
          break;
      }
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterStatusChange(status: 'tous' | 'actif' | 'expire-bientot' | 'expire'): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  getStatutProgramme(dateline: Date): 'actif' | 'expire-bientot' | 'expire' {
    return this.historiqueService.getStatutProgramme(dateline);
  }

  getJoursRestants(dateline: Date): number {
    return this.historiqueService.getJoursRestants(dateline);
  }

  // Méthodes pour gérer les dates dans le template
  getStatutProgrammeFromString(dateline: string | Date): 'actif' | 'expire-bientot' | 'expire' {
    const date = typeof dateline === 'string' ? new Date(dateline) : dateline;
    return this.historiqueService.getStatutProgramme(date);
  }

  getJoursRestantsFromString(dateline: string | Date): number {
    const date = typeof dateline === 'string' ? new Date(dateline) : dateline;
    return this.historiqueService.getJoursRestants(date);
  }

  getStatutSeverity(dateline: string | Date): 'success' | 'warning' | 'danger' {
    const statut = this.getStatutProgrammeFromString(dateline);
    switch (statut) {
      case 'actif':
        return 'success';
      case 'expire-bientot':
        return 'warning';
      case 'expire':
        return 'danger';
    }
  }

  getStatutLabel(dateline: string | Date): string {
    const statut = this.getStatutProgrammeFromString(dateline);
    const joursRestants = this.getJoursRestantsFromString(dateline);

    switch (statut) {
      case 'actif':
        return `Actif (${joursRestants} jours)`;
      case 'expire-bientot':
        return `Expire bientôt (${joursRestants} jours)`;
      case 'expire':
        return 'Expiré';
    }
  }

  openEditDialog(programme: Programmegp): void {
    this.selectedProgramme = programme;
    const dateline = typeof programme.dateline === 'string'
      ? new Date(programme.dateline)
      : programme.dateline;

    this.editedProgramme = {
      ...programme,
      dateline: dateline as any // Temporairement pour l'édition
    };
    this.displayEditDialog = true;
  }

  closeEditDialog(): void {
    this.displayEditDialog = false;
    this.selectedProgramme = null;
    this.editedProgramme = this.getEmptyProgramme();
  }

  saveProgramme(): void {
    if (!this.selectedProgramme || !this.editedProgramme.id) {
      return;
    }

    this.loading = true;



    const programmeToSave = {
      ...this.editedProgramme,
      // @ts-ignore
      dateline: this.editedProgramme.dateline instanceof Date
        ? this.editedProgramme.dateline.toISOString()
        : this.editedProgramme.dateline
    } as Programmegp;

    this.historiqueService.updateProgramme(this.editedProgramme.id, programmeToSave)
      .subscribe({
        next: (updated) => {
          const index = this.programmes.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            this.programmes[index] = updated;
          }

          this.applyFilters();
          this.calculateStats();

          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Programme mis à jour avec succès'
          });

          this.closeEditDialog();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de mettre à jour le programme'
          });
          this.loading = false;
        }
      });
  }

  confirmDelete(programme: Programmegp): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le programme "${programme.description}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.deleteProgramme(programme);
      }
    });
  }

  deleteProgramme(programme: Programmegp): void {
    if (!programme.id) {
      return;
    }

    this.loading = true;

    this.historiqueService.deleteProgramme(programme.id).subscribe({
      next: () => {
        this.programmes = this.programmes.filter(p => p.id !== programme.id);
        this.applyFilters();
        this.calculateStats();

        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Programme supprimé avec succès'
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer le programme'
        });
        this.loading = false;
      }
    });
  }

  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(value: string): string {
    return value || '0 €';
  }

  private getEmptyProgramme(): Programmegp {
    return {
      id: 0,
      description: '',
      depart: '',
      destination: '',
      prix: '',
      garantie: 0,
      dateline: new Date().toISOString(),
      agentGp: {} as any
    };
  }

  // Méthode pour rafraîchir la liste
  refresh(): void {
    this.searchText = '';
    this.filterStatus = 'tous';
    this.loadProgrammes();
  }
}
