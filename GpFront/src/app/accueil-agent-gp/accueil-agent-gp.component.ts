import {Component, OnInit} from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import {TranslatePipe} from '@ngx-translate/core';
import {TrackingService} from '../services/tracking-service.service';

@Component({
  selector: 'app-accueil-agent-gp',
  imports: [MenuComponent, TranslatePipe],
  templateUrl: './accueil-agent-gp.component.html',
  standalone: true,
  styleUrl: './accueil-agent-gp.component.css'
})
export class AccueilAgentGpComponent implements OnInit{
  constructor(
    private trackingService: TrackingService
  ) {
  }
  ngOnInit(): void {


    this.trackingService.trackUserAction('Accueil AgenceGp Page');
  }


}
