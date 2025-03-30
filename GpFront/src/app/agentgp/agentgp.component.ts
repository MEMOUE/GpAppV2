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

  constructor(
    private agenceService: AgenceService,
    private router: Router,
    private route: ActivatedRoute,
    private trackingService: TrackingService,

  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.depart = params['depart'];
      this.destination = params['destination'];
      if (this.depart && this.destination) {
        this.agenceService.getAgences(this.depart, this.destination).subscribe(data => {
          this.agences = data;
        });
      }
    });
    this.trackingService.trackUserAction('Recherche AgenceGp ');
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


  goToPublication(): void {
    this.router.navigate(['/publication']);
  }
}
