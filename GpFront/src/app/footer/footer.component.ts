import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface FooterLink {
  label: string;
  route: string;
  translateKey: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslatePipe,
    FormsModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  showScrollTop: boolean = false;
  newsletterEmail: string = '';

  // Informations de l'entreprise
  companyInfo = {
    name: 'GpMonde',
    description: 'MISSION',
    logo: 'logo2.png'
  };

  // Liens rapides
  quickLinks: FooterLink[] = [
    { label: 'Accueil', route: '/', translateKey: 'home' },
    { label: 'À propos', route: '/about', translateKey: 'footer.about' },
    { label: 'Services', route: '/services', translateKey: 'footer.services' },
    { label: 'Contact', route: '/contact', translateKey: 'footer.contact' }
  ];

  // Services
  serviceLinks: FooterLink[] = [
    { label: 'Offres GP', route: '/offers', translateKey: 'OFFRE_GP' },
    { label: 'Agences GP', route: '/agencies', translateKey: 'AGENCE_GP' },
    { label: 'Programmes GP', route: '/programs', translateKey: 'PROGRAMMES_GP' },
    { label: 'Publier une annonce', route: '/publish', translateKey: 'publishAd' }
  ];

  // Liens légaux
  legalLinks: FooterLink[] = [
    { label: 'Politique de confidentialité', route: '/privacy-policy', translateKey: 'footer.privacy_policy' }
  ];

  // Réseaux sociaux
  socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/gpmonde',
      icon: 'pi pi-facebook',
      color: '#1877f2'
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/gpmonde',
      icon: 'pi pi-twitter',
      color: '#1da1f2'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/gpmonde',
      icon: 'pi pi-instagram',
      color: '#e4405f'
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/gpmonde',
      icon: 'pi pi-linkedin',
      color: '#0a66c2'
    }
  ];

  // Informations de contact
  contactInfo = {
    phone: '+221 783077580',
    email: 'contact@gpmonde.com',
    address: 'Dakar, Senegal'
  };

  ngOnInit(): void {
    // Initialisation du composant
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showScrollTop = window.pageYOffset > 400;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  onSocialClick(platform: string): void {
    console.log(`Navigation vers ${platform}`);
  }

  onNewsletterSubmit(): void {
    if (this.newsletterEmail && this.newsletterEmail.trim() !== '') {
      console.log('Inscription à la newsletter:', this.newsletterEmail);
      // TODO: Appeler votre service API pour enregistrer l'email
      // this.newsletterService.subscribe(this.newsletterEmail).subscribe(...)

      // Réinitialiser le champ après soumission
      this.newsletterEmail = '';

      // Optionnel: Afficher un message de confirmation
      alert('Merci pour votre inscription !');
    }
  }
}
