import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AgenceService} from '../services/agence.service';
import {AgentGp} from '../model/Agentgp';
import {NgForOf, NgIf} from '@angular/common';
import {FooterComponent} from '../footer/footer.component';
import {window} from 'rxjs';
import {DialogModule} from 'primeng/dialog';
import {Button, ButtonDirective} from 'primeng/button';
import {TrackingService} from '../services/tracking-service.service';

@Component({
  selector: 'app-agentgp',
  standalone: true,
    imports: [
        FooterComponent,
        NgForOf,
        NgIf,
        DialogModule,
        ButtonDirective,
        Button,
    ],
  templateUrl: './agentgp.component.html',
  styleUrl: './agentgp.component.css'
})
export class AgentgpComponent implements OnInit {

  depart!: string;
  destination!: string;
  agences: AgentGp[] = [];
  selectedAgence: AgentGp | null = null;
  displayDialog: boolean = false;
  suivis: { [key: number]: boolean } = {};
  utilisateurId!: number;
  displayLoginDialog: boolean = false;
  isLoading: boolean = true;
  errorMessage: string | null = null;


  constructor(
    private agenceService: AgenceService,
    private router: Router,
    private route: ActivatedRoute,
    private trackingService: TrackingService,

  ) { }

  ngOnInit(): void {
    this.utilisateurId = Number(sessionStorage.getItem('iduser'));

    this.route.queryParams.subscribe(params => {
      this.depart = params['depart'];
      this.destination = params['destination'];
      this.errorMessage = null;
      this.isLoading = true;

      if (this.depart && this.destination) {
        this.agenceService.getAgences(this.depart, this.destination).subscribe({
          next: data => {
            if (Array.isArray(data) && data.length > 0) {
              this.agences = data;
              this.errorMessage = null;
              this.agences.forEach(agence => {
                this.suivis[agence.id] = false;
              });

              this.agenceService.getAgentsSuivis(this.utilisateurId).subscribe(suivis => {
                suivis.forEach(agent => {
                  this.suivis[agent.id] = true;
                });
              });

            } else {
              this.agences = [];
              this.errorMessage = 'Aucune agence disponible pour le moment.';
            }

            this.isLoading = false;
          },
          error: error => {
            this.agences = [];
            this.errorMessage = 'Une erreur est survenue lors du chargement des agences.';
            this.isLoading = false;
            console.error(error);
          }
        });
      } else {
        this.agences = [];
        this.errorMessage = 'Veuillez préciser le départ et la destination.';
        this.isLoading = false;
      }
    });

    this.trackingService.trackUserAction('Recherche AgenceGp');
  }


  openDetailDialog(agence: AgentGp): void {
    this.selectedAgence = agence;
    this.displayDialog = true;
  }

  contactAgent(telephone: string): void {
    (window as any).open(`https://wa.me/${telephone}`, '_blank');
  }

  callAgent(telephone: string): void {
    (window as any).location.href = `tel:${telephone}`;
  }

  // Méthode modifiée pour ouvrir le modal si l'utilisateur n'est pas connecté
  toggleSuivi(agence: AgentGp): void {
    const utilisateurId = sessionStorage.getItem('iduser');

    if (!utilisateurId) {
      // Ouvre un modal pour demander à l'utilisateur de se connecter
      this.displayLoginDialog = true;
      return;
    }

    if (this.suivis[agence.id]) {
      this.agenceService.arreterSuivreAgent(Number(utilisateurId), agence.id).subscribe(() => {
        this.suivis[agence.id] = false;
      });
    } else {
      this.agenceService.suivreAgent(Number(utilisateurId), agence.id).subscribe(() => {
        this.suivis[agence.id] = true;
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);  // Rediriger vers la page de connexion
    this.displayLoginDialog = false;  // Fermer le modal
  }

  goToPublication(): void {
    this.router.navigate(['/besoingp']);
  }


}
