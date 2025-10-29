import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GpService } from '../services/gp.service';
import { BesoinService } from '../services/besoin.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TrackingService } from '../services/tracking-service.service';
import { Programmegp } from '../model/Programmegp';
import { Besoin } from '../model/Besoin';
import { Subject, timer, takeUntil, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface SearchParams {
  depart: string;
  destination: string;
}

interface Agence {
  id: number;
  nom: string;
  ville: string;
  telephone: string;
  logo?: string;
}

interface Publicite {
  id: number;
  titre: string;
  image: string;
}

type SearchType = 'offreGp' | 'agenceGp';
type CurrencyType = 'EUR' | 'USD' | 'GBP' | 'XOF' | 'MAD' | '€' | '$' | '£';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    FormsModule,
    RouterModule,
    ButtonModule,
    CarouselModule,
    InputTextModule,
    DialogModule,
    TooltipModule
  ],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit, OnDestroy {
  private readonly gpService = inject(GpService);
  private readonly besoinService = inject(BesoinService);
  private readonly router = inject(Router);
  private readonly trackingService = inject(TrackingService);
  private readonly destroy$ = new Subject<void>();

  // Signals d'état
  readonly activeImageIndex = signal<number>(0);
  readonly activeSearch = signal<SearchType>('offreGp');
  readonly showContactOptions = signal<boolean>(false);
  readonly programmegps = signal<Programmegp[]>([]);
  readonly selectedProgramme = signal<Programmegp | null>(null);
  readonly displayDetails = signal<boolean>(false);
  readonly selectedBesoin = signal<Besoin | null>(null);
  readonly displayBesoinDetails = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly search = signal<SearchParams>({ depart: '', destination: '' });

  // Signals pour les besoins
  readonly besoins = signal<Besoin[]>([]);
  readonly besoinsLoading = signal<boolean>(false);
  readonly besoinsError = signal<string | null>(null);

  // Signals pour les agences et publicités
  readonly agences = signal<Agence[]>([]);
  readonly publicites = signal<Publicite[]>([]);

  // Configuration
  private readonly fallbackImage = 'icons/bag1.png';

  readonly phrases: readonly string[] = [
    'Trouvez les meilleures offres de transport',
    'Connectez-vous avec des agences fiables',
    'Expédiez vos colis en toute sécurité',
    'Des milliers de destinations disponibles'
  ];

  readonly images: readonly string[] = [
    'images/vol.jpg',
    'images/colis.png',
    'images/bateau.jpg',
    'images/car.png'
  ];

  readonly carouselResponsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 3,
      numScroll: 1
    },
    {
      breakpoint: '1024px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  readonly currentPhrase = computed(() => this.phrases[this.activeImageIndex()]);
  readonly hasSearchData = computed(() => {
    const searchData = this.search();
    return Boolean(searchData.depart?.trim() && searchData.destination?.trim());
  });

  private readonly currencyMapping: Record<CurrencyType, { symbol: string; decimals: number }> = {
    'EUR': { symbol: '€', decimals: 2 },
    '€': { symbol: '€', decimals: 2 },
    'USD': { symbol: '$', decimals: 2 },
    '$': { symbol: '$', decimals: 2 },
    'GBP': { symbol: '£', decimals: 2 },
    '£': { symbol: '£', decimals: 2 },
    'XOF': { symbol: 'FCFA', decimals: 0 },
    'MAD': { symbol: 'MAD', decimals: 2 }
  };

  ngOnInit(): void {
    this.initializeCarousel();
    this.loadProgrammes();
    this.loadBesoins();
    this.loadAgences();
    this.loadPublicites();
    this.trackUserVisit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCarousel(): void {
    timer(0, 5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const nextIndex = (this.activeImageIndex() + 1) % this.images.length;
        this.activeImageIndex.set(nextIndex);
      });
  }

  loadProgrammes(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.gpService.getactivegp()
      .pipe(
        catchError(error => {
          console.error('Erreur chargement programmes:', error);
          this.error.set('Impossible de charger les programmes');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.programmegps.set(data);
        this.isLoading.set(false);
      });
  }

  loadBesoins(): void {
    this.besoinsLoading.set(true);
    this.besoinsError.set(null);

    this.besoinService.getAllBesoins()
      .pipe(
        catchError(error => {
          console.error('Erreur chargement besoins:', error);
          this.besoinsError.set('Impossible de charger les besoins');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.besoins.set(data);
        this.besoinsLoading.set(false);
      });
  }

  private loadAgences(): void {
    // Données de démonstration - À remplacer par un vrai service
    this.agences.set([
      { id: 1, nom: 'GP Express', ville: 'Dakar', telephone: '+221771234567' },
      { id: 2, nom: 'Trans Africa', ville: 'Abidjan', telephone: '+225071234567' },
      { id: 3, nom: 'Euro GP', ville: 'Paris', telephone: '+33612345678' },
      { id: 4, nom: 'Quick Send', ville: 'Lomé', telephone: '+228901234567' }
    ]);
  }

  private loadPublicites(): void {
    this.publicites.set([
      { id: 1, titre: 'Partenaire 1', image: 'emunie.jpg' },
      { id: 2, titre: 'Partenaire 2', image: 'iub.png' },
      { id: 3, titre: 'Partenaire 3', image: 'memkotech.png' },
      { id: 4, titre: 'Partenaire 4', image: 'images/partner4.png' }
    ]);
  }

  private trackUserVisit(): void {
    try {
      this.trackingService.trackUserAction('Home Page Visit');
    } catch (error) {
      console.warn('Erreur tracking:', error);
    }
  }

  // Méthodes de recherche
  showSearchForm(type: SearchType): void {
    this.activeSearch.set(type);
  }

  updateSearch(field: keyof SearchParams, value: string): void {
    this.search.update(current => ({
      ...current,
      [field]: value
    }));
  }

  searchResults(): void {
    if (!this.hasSearchData()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const queryParams = {
      type: this.activeSearch(),
      depart: this.search().depart.trim(),
      destination: this.search().destination.trim()
    };

    const route = this.activeSearch() === 'offreGp' ? '/listgp' : '/agencegp';
    this.router.navigate([route], { queryParams });
  }

  // Gestion des logos
  getAgentLogoUrl(agentGp: any): string {
    if (!agentGp?.logourl) return this.fallbackImage;
    if (agentGp.logourl.startsWith('http')) return agentGp.logourl;

    // Le backend retourne "/logos/filename.jpg"
    const cleanPath = agentGp.logourl.startsWith('/')
      ? agentGp.logourl.substring(1)
      : agentGp.logourl;

    // Construction correcte : http://localhost:8080/api/files/logos/filename.jpg
    return `${environment.apiUrl}files/${cleanPath}`;  // ✅ CORRECTION
  }

  hasAgentLogo(agentGp: any): boolean {
    return !!(agentGp?.logourl?.trim());
  }

  onImageError(event: any): void {
    console.warn('Erreur chargement image:', event.target.src);
    event.target.src = this.fallbackImage;
  }

  // Formatage du prix
  formatPrice(prix: string | number): string {
    if (!prix) return 'Prix non spécifié';

    const prixString = prix.toString().trim();
    const deviseRegex = /(\d+(?:[.,]\d{1,2})?)\s*(EUR|USD|GBP|XOF|MAD|€|\$|£)/i;
    const match = prixString.match(deviseRegex);

    if (match) {
      const montant = parseFloat(match[1].replace(',', '.'));
      const devise = match[2].toUpperCase() as CurrencyType;
      return this.formatCurrency(montant, devise);
    }

    const montant = parseFloat(prixString.replace(',', '.'));
    return isNaN(montant) ? prixString : this.formatCurrency(montant, 'EUR');
  }

  private formatCurrency(amount: number, currency: CurrencyType): string {
    const config = this.currencyMapping[currency];
    if (!config) return `${amount.toFixed(2)} ${currency}`;

    const formattedAmount = amount.toFixed(config.decimals);
    return `${formattedAmount} ${config.symbol}`;
  }

  // Méthodes pour les besoins
  formatDate(dateString: string): string {
    if (!dateString) return 'Date non spécifiée';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  }

  openWhatsapp(telephone: string): void {
    if (telephone) {
      const cleanedPhone = telephone.replace(/\s+/g, '');
      window.open(`https://wa.me/${cleanedPhone}`, '_blank');
    }
  }

  callPhone(telephone: string): void {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  }

  // Gestion des détails
  showDetails(programme: Programmegp): void {
    this.selectedProgramme.set(programme);
    this.displayDetails.set(true);
  }

  closeDetails(): void {
    this.displayDetails.set(false);
    this.selectedProgramme.set(null);
  }

  // Gestion des détails de besoin
  showBesoinDetails(besoin: Besoin): void {
    this.selectedBesoin.set(besoin);
    this.displayBesoinDetails.set(true);
  }

  closeBesoinDetails(): void {
    this.displayBesoinDetails.set(false);
    this.selectedBesoin.set(null);
  }

  // Méthodes de contact
  toggleContactOptions(): void {
    this.showContactOptions.update(current => !current);
  }

  openWhatsApp(): void {
    const telephone = this.selectedProgramme()?.agentGp?.telephone;
    if (telephone) {
      window.open(`https://wa.me/${telephone}`, '_blank');
    }
  }

  makePhoneCall(): void {
    const telephone = this.selectedProgramme()?.agentGp?.telephone;
    if (telephone) {
      window.location.href = `tel:+${telephone}`;
    }
  }

  sendSms(): void {
    const telephone = this.selectedProgramme()?.agentGp?.telephone;
    if (telephone) {
      window.open(`sms:+${telephone}`, '_blank');
    }
  }
}
