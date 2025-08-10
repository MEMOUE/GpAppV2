import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GpService } from '../services/gp.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TrackingService } from '../services/tracking-service.service';
import { Programmegp } from '../model/Programmegp';
import { Subject, takeUntil, timer, startWith, switchMap, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// Constants
const CAROUSEL_INTERVAL = 5000;
const SCROLL_ANIMATION_DURATION = 300; // Réduit pour une réaction plus rapide
const SCROLL_CARDS_COUNT = 3; // Fixé à 3 cartes comme demandé
const DEFAULT_CURRENCY = '€';

// Interfaces
interface SearchParams {
  depart: string;
  destination: string;
}

interface ContactMethod {
  icon: string;
  label: string;
  action: () => void;
}

type SearchType = 'offreGp' | 'agenceGp';
type CurrencyType =
  | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY'
  | 'XOF' | 'MAD' | 'DZD' | 'EGP' | 'NGN' | 'ZAR' | 'TND'
  | 'BRL' | 'RUB' | 'INR' | 'KRW' | 'MXN' | 'SGD' | 'NZD'
  | 'SEK' | 'NOK' | 'DKK' | 'TRY' | 'PLN' | 'THB' | 'HKD' | 'ILS'
  | '€' | '$' | '£' | '¥' | '₽' | '₹' | '₩' | '₺' | 'zł' | '฿' | '₪';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccueilComponent implements OnInit, OnDestroy {
  // Services injection
  private readonly gpService = inject(GpService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly trackingService = inject(TrackingService);

  // Destruction signal
  private readonly destroy$ = new Subject<void>();

  // State signals
  readonly activePhraseIndex = signal<number>(0);
  readonly activeImageIndex = signal<number>(0);
  readonly activeSearch = signal<SearchType>('offreGp');
  readonly showContactOptions = signal<boolean>(false);
  readonly programmegps = signal<Programmegp[]>([]);
  readonly selectedProgramme = signal<Programmegp | null>(null);
  readonly displayDetails = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Search form state
  readonly search = signal<SearchParams>({ depart: '', destination: '' });

  // Scroll management
  private isScrolling = false;
  private currentScrollPosition = 0;

  // URL de base pour les assets et image par défaut
  private readonly baseUrl = environment.apiUrl.replace('/api/', '');
  private readonly fallbackImage = 'icons/bag1.png';

  // Static data
  readonly phrases: readonly string[] = [
    'Bienvenue sur notre plateforme de transport et de services.',
    'Nous mettons l\'innovation au cœur de chaque expérience.',
    'Faites confiance à notre équipe pour un service rapide et sécurisé.',
    'Nous sommes là pour vous accompagner dans vos projets de transport.',
  ] as const;

  readonly images: readonly string[] = [
    'images/vol.jpg',
    'images/colis.png',
    'images/bateau.jpg',
    'images/car.png',
  ] as const;

  readonly whatsappLink: string = 'https://wa.me/221761517642';

  // Computed values
  readonly currentPhrase = computed(() => this.phrases[this.activePhraseIndex()]);
  readonly currentImage = computed(() => this.images[this.activeImageIndex()]);
  readonly hasSearchData = computed(() => {
    const searchData = this.search();
    return Boolean(searchData.depart?.trim() && searchData.destination?.trim());
  });

  readonly contactMethods = computed((): ContactMethod[] => {
    const programme = this.selectedProgramme();
    if (!programme?.agentGp?.telephone) return [];

    return [
      {
        icon: 'pi pi-whatsapp',
        label: 'WhatsApp',
        action: () => this.openWhatsApp()
      },
      {
        icon: 'pi pi-phone',
        label: 'Téléphone',
        action: () => this.makePhoneCall()
      },
      {
        icon: 'pi pi-comment',
        label: 'SMS',
        action: () => this.sendSms()
      }
    ];
  });

  // Currency mapping for price formatting
  private readonly currencyMapping: Record<CurrencyType, { symbol: string; decimals: number }> = {
    // Devises principales
    'EUR': { symbol: '€', decimals: 2 },
    '€': { symbol: '€', decimals: 2 },
    'USD': { symbol: '$', decimals: 2 },
    '$': { symbol: '$', decimals: 2 },
    'GBP': { symbol: '£', decimals: 2 },
    '£': { symbol: '£', decimals: 2 },
    'JPY': { symbol: '¥', decimals: 0 },
    '¥': { symbol: '¥', decimals: 0 },
    'AUD': { symbol: 'A$', decimals: 2 },
    'CAD': { symbol: 'CA$', decimals: 2 },
    'CHF': { symbol: 'CHF', decimals: 2 },
    'CNY': { symbol: 'CN¥', decimals: 2 },

    // Devises africaines
    'XOF': { symbol: 'FCFA', decimals: 0 },
    'MAD': { symbol: 'MAD', decimals: 2 },
    'DZD': { symbol: 'DZD', decimals: 2 },
    'EGP': { symbol: 'EG£', decimals: 2 },
    'NGN': { symbol: '₦', decimals: 2 },
    'ZAR': { symbol: 'R', decimals: 2 },
    'TND': { symbol: 'DT', decimals: 3 },

    // Autres devises importantes
    'BRL': { symbol: 'R$', decimals: 2 },
    'RUB': { symbol: '₽', decimals: 2 },
    '₽': { symbol: '₽', decimals: 2 },
    'INR': { symbol: '₹', decimals: 2 },
    '₹': { symbol: '₹', decimals: 2 },
    'KRW': { symbol: '₩', decimals: 0 },
    '₩': { symbol: '₩', decimals: 0 },
    'MXN': { symbol: 'MX$', decimals: 2 },
    'SGD': { symbol: 'S$', decimals: 2 },
    'NZD': { symbol: 'NZ$', decimals: 2 },
    'SEK': { symbol: 'kr', decimals: 2 },
    'NOK': { symbol: 'kr', decimals: 2 },
    'DKK': { symbol: 'kr', decimals: 2 },
    'TRY': { symbol: '₺', decimals: 2 },
    '₺': { symbol: '₺', decimals: 2 },
    'PLN': { symbol: 'zł', decimals: 2 },
    'zł': { symbol: 'zł', decimals: 2 },
    'THB': { symbol: '฿', decimals: 2 },
    '฿': { symbol: '฿', decimals: 2 },
    'HKD': { symbol: 'HK$', decimals: 2 },
    'ILS': { symbol: '₪', decimals: 2 },
    '₪': { symbol: '₪', decimals: 2 }
  };

  ngOnInit(): void {
    this.initializeCarousel();
    this.loadProgrammes();
    this.trackUserVisit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialization methods
  private initializeCarousel(): void {
    timer(0, CAROUSEL_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const nextIndex = (this.activePhraseIndex() + 1) % this.phrases.length;
        this.activePhraseIndex.set(nextIndex);
        this.activeImageIndex.set(nextIndex);
      });
  }

  protected loadProgrammes(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.gpService.getactivegp()
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des programmes:', error);
          this.error.set('Impossible de charger les programmes. Veuillez réessayer.');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        const enhancedProgrammes = data.map(programme => ({
          ...programme,
          isExpanded: false
        }));
        this.programmegps.set(enhancedProgrammes);
        this.isLoading.set(false);
      });
  }

  private trackUserVisit(): void {
    try {
      this.trackingService.trackUserAction('Home Page');
    } catch (error) {
      console.warn('Erreur de tracking:', error);
    }
  }

  // Logo management methods
  /**
   * Obtient l'URL complète du logo de l'agent
   * @param agentGp L'agent GP
   * @returns L'URL du logo ou une image par défaut
   */
  getAgentLogoUrl(agentGp: any): string {
    if (!agentGp || !agentGp.logourl) {
      return this.fallbackImage;
    }

    // Si l'URL commence par http, c'est déjà une URL complète
    if (agentGp.logourl.startsWith('http')) {
      return agentGp.logourl;
    }

    // Sinon, construire l'URL complète
    const logoPath = agentGp.logourl.startsWith('/')
      ? agentGp.logourl.substring(1)
      : agentGp.logourl;

    return `${this.baseUrl}/${logoPath}`;
  }

  /**
   * Gère les erreurs de chargement d'image
   * @param event L'événement d'erreur
   */
  onImageError(event: any): void {
    console.warn('Erreur de chargement de l\'image:', event.target.src);
    event.target.src = this.fallbackImage;
  }

  /**
   * Vérifie si l'agent a un logo disponible
   * @param agentGp L'agent GP
   * @returns true si un logo est disponible
   */
  hasAgentLogo(agentGp: any): boolean {
    return !!(agentGp && agentGp.logourl && agentGp.logourl.trim());
  }

  // Public methods
  toggleContactOptions(): void {
    this.showContactOptions.update(current => !current);
  }

  showSearchForm(type: SearchType): void {
    this.activeSearch.set(type);
  }

  searchResults(): void {
    if (!this.hasSearchData()) {
      this.showValidationError('Veuillez entrer un lieu de départ et une destination.');
      return;
    }

    const queryParams = {
      type: this.activeSearch(),
      depart: this.search().depart.trim(),
      destination: this.search().destination.trim(),
    };

    const navigationTarget = this.activeSearch() === 'offreGp' ? '/listgp' : '/agencegp';

    this.router.navigate([navigationTarget], { queryParams })
      .catch(error => {
        console.error('Erreur de navigation:', error);
        this.showValidationError('Erreur lors de la navigation. Veuillez réessayer.');
      });
  }

  // Price formatting with improved currency handling
  formatPrice(prix: string | number): string {
    if (!prix) return 'Prix non spécifié';

    const prixString = prix.toString().trim();
    const deviseRegex = /(\d+(?:[.,]\d{1,2})?)\s*(EUR|USD|GBP|CHF|CAD|XOF|MAD|€|\$|£)/i;
    const match = prixString.match(deviseRegex);

    if (match) {
      const montant = this.parseAmount(match[1]);
      const devise = match[2].toUpperCase() as CurrencyType;
      return this.formatCurrency(montant, devise);
    }

    // Fallback: treat as number
    const montant = this.parseAmount(prixString);
    return isNaN(montant) ? prixString : this.formatCurrency(montant, 'EUR');
  }

  private parseAmount(amount: string): number {
    return parseFloat(amount.replace(',', '.'));
  }

  private formatCurrency(amount: number, currency: CurrencyType): string {
    const config = this.currencyMapping[currency];
    if (!config) {
      return `${amount.toFixed(2)} ${currency}`;
    }

    const formattedAmount = amount.toFixed(config.decimals);
    return `${formattedAmount} ${config.symbol}`;
  }

  // Improved scroll methods - tire les cartes en arrière
  scrollLeft(): void {
    if (this.isScrolling) return;
    this.pullCardsBack('left');
  }

  scrollRight(): void {
    if (this.isScrolling) return;
    this.pullCardsBack('right');
  }

  private pullCardsBack(direction: 'left' | 'right'): void {
    const wrapper = this.getProgrammesWrapper();
    if (!wrapper) {
      console.warn('Wrapper element not found');
      return;
    }

    this.isScrolling = true;
    this.pauseAnimation(wrapper);

    const cardsToPull = 3; // Toujours 3 cartes comme demandé

    if (direction === 'right') {
      // Scroll droite: tirer les cartes de la fin vers le début (ramener en arrière)
      // Prendre les 3 dernières cartes et les mettre au début
      for (let i = 0; i < cardsToPull; i++) {
        const lastCard = wrapper.lastElementChild;
        if (lastCard) {
          wrapper.insertBefore(lastCard, wrapper.firstElementChild);
        }
      }
    } else {
      // Scroll gauche: tirer les cartes du début vers la fin (ramener en arrière dans l'autre sens)
      // Prendre les 3 premières cartes et les mettre à la fin
      for (let i = 0; i < cardsToPull; i++) {
        const firstCard = wrapper.firstElementChild;
        if (firstCard) {
          wrapper.appendChild(firstCard);
        }
      }
    }

    // Reprendre l'animation après un court délai
    setTimeout(() => {
      this.resumeAnimation(wrapper);
      this.isScrolling = false;
    }, 200); // Délai réduit pour une réaction plus rapide
  }

  private getProgrammesWrapper(): HTMLElement | null {
    return document.querySelector('.programmes-wrapper') as HTMLElement;
  }

  private getProgrammesContainer(): HTMLElement | null {
    return document.querySelector('.programmes-container') as HTMLElement;
  }

  pauseScroll(): void {
    const wrapper = this.getProgrammesWrapper();
    if (wrapper) this.pauseAnimation(wrapper);
  }

  resumeScroll(): void {
    const wrapper = this.getProgrammesWrapper();
    if (wrapper && !this.isScrolling) this.resumeAnimation(wrapper);
  }

  private pauseAnimation(element: HTMLElement): void {
    element.style.animationPlayState = 'paused';
  }

  private resumeAnimation(element: HTMLElement): void {
    element.style.animationPlayState = 'running';
  }

  // Contact methods
  openWhatsApp(): void {
    const telephone = this.selectedProgramme()?.agentGp?.telephone;
    if (telephone) {
      this.openExternalLink(`https://wa.me/${telephone}`);
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
      this.openExternalLink(`sms:+${telephone}`);
    }
  }

  private openExternalLink(url: string): void {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du lien:', error);
    }
  }

  // Modal methods
  showDetails(programme: Programmegp): void {
    this.selectedProgramme.set(programme);
    this.displayDetails.set(true);
  }

  closeDetails(): void {
    this.displayDetails.set(false);
    this.selectedProgramme.set(null);
  }

  // Utility methods
  private showValidationError(message: string): void {
    // Vous pouvez remplacer ceci par votre système de notification préféré
    alert(message);
  }

  // TrackBy functions for performance
  trackByProgrammeId(index: number, programme: Programmegp): string | number {
    return programme.id || index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Update search form
  updateSearch(field: keyof SearchParams, value: string): void {
    this.search.update(current => ({
      ...current,
      [field]: value
    }));
  }

  // Accessibility helpers
  getSearchButtonAriaLabel(): string {
    const type = this.activeSearch() === 'offreGp' ? 'offres' : 'agences';
    return `Rechercher des ${type} GP`;
  }

  getProgrammeAriaLabel(programme: Programmegp): string {
    return `Programme de ${programme.depart} vers ${programme.destination}, prix ${this.formatPrice(programme.prix)}`;
  }

  // Debug methods for development
  private logScrollState(): void {
    console.log('Current scroll position:', this.currentScrollPosition);
    console.log('Is scrolling:', this.isScrolling);

    const wrapper = this.getProgrammesWrapper();
    if (wrapper) {
      console.log('Cards count:', wrapper.children.length);
    }
  }

  // Reset scroll position (useful for testing)
  resetScrollPosition(): void {
    this.currentScrollPosition = 0;
    this.isScrolling = false;

    const wrapper = this.getProgrammesWrapper();
    if (wrapper) {
      wrapper.style.transform = '';
      wrapper.style.transition = '';
      this.resumeAnimation(wrapper);
    }
  }
}
