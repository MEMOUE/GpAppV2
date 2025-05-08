import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GpService } from '../services/gp.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import {DialogModule} from 'primeng/dialog';
import {TrackingService} from '../services/tracking-service.service';
import {Programmegp} from '../model/Programmegp';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    FormsModule,
    TranslatePipe,
    ButtonModule,
    CarouselModule,
    InputTextModule,
    DialogModule,
  ],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css'],
})
export class AccueilComponent implements OnInit {
  // Variables existantes
  phrases: string[] = [
    'Bienvenue sur notre plateforme de transport et de services.',
    'Nous mettons l\'innovation au cœur de chaque expérience.',
    'Faites confiance à notre équipe pour un service rapide et sécurisé.',
    'Nous sommes là pour vous accompagner dans vos projets de transport.',
  ];
  activePhraseIndex: number = 0;
  showContactOptions: boolean = false;
  whatsappLink: string = 'https://wa.me/221761517642';
  images: string[] = [
    'images/vol.jpg',
    'images/colis.png',
    'images/bateau.jpg',
    'images/car.png',
  ];
  activeImageIndex: number = 0;
  activeSearch: string = 'offreGp';
  search = { depart: '', destination: '' };

  programmegps: Programmegp[] = [];
  depart!: string;
  destination!: string;
  selectedProgramme: Programmegp | null = null;
  displayDetails: boolean = false;

  constructor(
    private gpservice: GpService,
    private router: Router,
    private route: ActivatedRoute,
    private trackingService: TrackingService
  ) {}

  ngOnInit(): void {
    setInterval(() => {
      this.activePhraseIndex = (this.activePhraseIndex + 1) % this.phrases.length;
      this.activeImageIndex = this.activePhraseIndex; // Synchronize image with phrase
    }, 5000);

    this.getAllGp();

    this.trackingService.trackUserAction('Home Page');
  }

  getAllGp(): void {
    this.gpservice.getAllgp().subscribe(data => {
      this.programmegps = data.map(programme => ({
        ...programme,
        isExpanded: false
      }));
    });
  }

  toggleContactOptions(): void {
    this.showContactOptions = !this.showContactOptions;
  }

  showSearchForm(type: string): void {
    this.activeSearch = type;
  }

  searchResults(): void {
    if (this.search.depart && this.search.destination) {
      const queryParams = {
        type: this.activeSearch,
        depart: this.search.depart,
        destination: this.search.destination,
      };

      if (this.activeSearch === 'offreGp') {
        this.router.navigate(['/listgp'], { queryParams });
      } else {
        this.router.navigate(['/agencegp'], { queryParams });
      }
    } else {
      alert('Veuillez entrer un lieu de départ et une destination.');
    }
  }



  scrollLeft(): void {
    const wrapper = document.querySelector('.programmes-wrapper') as HTMLElement;
    const programmeCard = document.querySelector('.programme-card') as HTMLElement;

    if (wrapper && programmeCard) {
      // Calculer la largeur de trois cartes de programme
      const cardWidth = programmeCard.offsetWidth;
      const margin = 10; // marge approximative entre les cartes
      const scrollDistance = (cardWidth + margin) * 3; // Défilement pour 3 programmes

      wrapper.style.animationPlayState = 'paused'; // Pause l'animation automatique
      wrapper.scrollBy({ left: -scrollDistance, behavior: 'smooth' });

      setTimeout(() => {
        wrapper.style.animationPlayState = 'running'; // Reprend l'animation après 1 seconde
      }, 1000);
    }
  }

  scrollRight(): void {
    const wrapper = document.querySelector('.programmes-wrapper') as HTMLElement;
    const programmeCard = document.querySelector('.programme-card') as HTMLElement;

    if (wrapper && programmeCard) {
      // Calculer la largeur de trois cartes de programme
      const cardWidth = programmeCard.offsetWidth;
      const margin = 10; // marge approximative entre les cartes
      const scrollDistance = (cardWidth + margin) * 3; // Défilement pour 3 programmes

      wrapper.style.animationPlayState = 'paused'; // Pause l'animation automatique
      wrapper.scrollBy({ left: scrollDistance, behavior: 'smooth' });

      setTimeout(() => {
        wrapper.style.animationPlayState = 'running'; // Reprend l'animation après 1 seconde
      }, 1000);
    }
  }

  pauseScroll(): void {
    const wrapper = document.querySelector('.programmes-wrapper') as HTMLElement;
    wrapper.style.animationPlayState = 'paused'; // Pause l'animation au survol
  }

  resumeScroll(): void {
    const wrapper = document.querySelector('.programmes-wrapper') as HTMLElement;
    wrapper.style.animationPlayState = 'running'; // Reprend l'animation après le survol
  }

// Pour le dialog (sans paramètre, utilise selectedProgramme)
  openWhatsApp(): void {
    if (this.selectedProgramme?.agentGp?.telephone) {
      window.open(`https://wa.me/${this.selectedProgramme.agentGp.telephone}`, '_blank');
    }
  }

  makePhoneCall(): void {
    if (this.selectedProgramme?.agentGp?.telephone) {
      window.location.href = `tel:+${this.selectedProgramme.agentGp.telephone}`;
    }
  }

  sendSms(): void {
    if (this.selectedProgramme?.agentGp?.telephone) {
      window.open(`sms:+${this.selectedProgramme.agentGp.telephone}`, '_blank');
    }
  }

  // Méthode pour afficher les détails
  showDetails(programme: Programmegp): void {
    this.selectedProgramme = programme;
    this.displayDetails = true;
  }

}
