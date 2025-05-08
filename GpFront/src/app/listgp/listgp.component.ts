import {Component, OnInit} from '@angular/core';
import {Programmegp} from '../model/Programmegp';
import {GpService} from '../services/gp.service';
import {CardModule} from 'primeng/card';
import {Button} from 'primeng/button';
import {ActivatedRoute, Router} from '@angular/router';
import {CurrencyPipe, NgForOf, NgIf} from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import {AuthService} from '../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import {TrackingService} from '../services/tracking-service.service';
import {FooterComponent} from '../footer/footer.component';



@Component({
  selector: 'app-listgp',
  standalone: true,
  imports: [CardModule, Button, CurrencyPipe, NgForOf, TableModule, InputTextModule, NgIf, DialogModule, FooterComponent],
  templateUrl: './listgp.component.html',
  styleUrl: './listgp.component.css'
})
export class ListgpComponent implements OnInit {
  programmegps: Programmegp[] = [];
  depart!: string;
  destination!: string;
  offres: Programmegp[] = [];
  selectedProgramme: Programmegp | null = null;
  displayDetails: boolean = false;
  errorMessage: string | null = null;



  constructor(
    private authService: AuthService,
    private gpService: GpService,
    private router: Router,
    private route: ActivatedRoute,
    private trackingService: TrackingService
    ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.depart = params['depart'];
      this.destination = params['destination'];

      if (this.depart && this.destination) {
        this.gpService.getOffres(this.depart, this.destination).subscribe({
          next: data => {
            if (Array.isArray(data)) {
              this.offres = data;
              this.errorMessage = data.length === 0 ? 'Aucun programme disponible pour le moment.' : null;
            } else {
              this.offres = [];
              this.errorMessage = 'Aucun programme disponible pour le moment.';
            }
          },
          error: error => {
            this.offres = [];
            this.errorMessage = 'Une erreur s\'est produite lors du chargement des programmes.';
            console.error(error);
          }
        });
      }
    });
  }



    // Méthode pour alterner l'état d'expansion de la carte
  onCardClick(programme: Programmegp): void {
    programme.isExpanded = !programme.isExpanded;
  }

  onDelete(programmeId: number): void {
    this.gpService.deleteGp(programmeId).subscribe(() => {
      this.programmegps = this.programmegps.filter(programme => programme.id !== programmeId);
    });
  }

  onEdit(programmeId: number): void {
    this.router.navigate(['/edit', programmeId]);
  }

  goToPublication() {
    this.router.navigate(['/besoingp']);
  }

  isOwner(agentId: number): boolean {
    const userId = this.authService.getUserId();
    return userId === agentId;
  }


  // Méthode pour afficher les détails
  showDetails(programme: Programmegp): void {
    this.selectedProgramme = programme;
    this.displayDetails = true;
  }



  protected readonly window = window;
}
