import {Component, Input, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import {BesoinService} from '../services/besoin.service';
import {MessageModule} from 'primeng/message';
import {Besoin} from '../model/Besoin';
import {FooterComponent} from '../footer/footer.component';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {TrackingService} from '../services/tracking-service.service';
import {DialogModule} from 'primeng/dialog';

@Component({
  selector: 'app-addbesoin',
  standalone: true,
  imports: [MenuComponent, ReactiveFormsModule, CommonModule, InputTextModule, ButtonModule, CalendarModule, InputNumberModule, MessageModule, FooterComponent, DialogModule],
  templateUrl: './addbesoin.component.html',
  styleUrl: './addbesoin.component.css'
})
export class AddbesoinComponent implements OnInit {
  addBesoinForm!: FormGroup;
  @Input() existingProgram: any = null;
  responseMessage: string = '';
  messageType: 'success' | 'error' = 'success';
  besoins: Besoin[] = [];
  showForm: boolean = false;
  showLoginDialog: boolean = false;

  constructor(
    private fb: FormBuilder,
    private besoinService: BesoinService,
    private router: Router,
    private authService: AuthService,
    private trackingService: TrackingService
    ) {}

  ngOnInit(): void {
    this.addBesoinForm = this.fb.group({
      telephone: ['', Validators.required],
      description: ['', Validators.required],
      dateline: ['', Validators.required]
    });

    this.loadBesoins();
    this.trackingService.trackUserAction('Besoin page ');
  }

  onSubmit(): void {
    if (!this.authService.isLoggedIn()) {
      this.showLoginDialog = true;
      return;
    }
    if (this.addBesoinForm.invalid) {
      this.responseMessage = "Veuillez remplir tous les champs correctement.";
      this.messageType = 'error';
      return;
    }
    const programData = {
      ...this.addBesoinForm.value,
      utilisateur: { id: this.authService.getUserId() }
    }
    this.besoinService.addBesoin(programData).subscribe(
      (response) => {
        this.responseMessage = "Le programme a été ajouté avec succès !";
        this.messageType = 'success';
        this.addBesoinForm.reset();
      },
      (error) => {
        if (error.status === 400) {
          this.responseMessage = "Erreur dans les données envoyées. Veuillez vérifier les champs.";
        } else if (error.status === 500) {
          this.responseMessage = "Erreur du technique. Veuillez réessayer plus tard.";
        } else {
          this.responseMessage = "Une erreur inconnue est survenue.";
        }
        this.messageType = 'error';
      }
    );
  }

  loadBesoins(): void {
    this.besoinService.getAllBesoins().subscribe(data => {
      this.besoins = data;
    });
  }

  onDelete(programmeId: number): void {
    this.besoinService.deleteGp(programmeId).subscribe(() => {
      this.besoins = this.besoins.filter(besoins => besoins.id !== programmeId);
    });
  }

  onEdit(programmeId: number): void {
    this.router.navigate(['/edit', programmeId]);
  }

  // Méthode pour ouvrir WhatsApp avec le numéro de téléphone
  openWhatsapp(telephone: string): void {
    const whatsappUrl = `https://wa.me/${telephone}`;
    window.open(whatsappUrl, '_blank');
  }
  callPhone(telephone: string): void {
    window.location.href = `tel:${telephone}`;
  }

  isOwner(agentId: number): boolean {
    const userId = this.authService.getUserId();
    return userId === agentId;
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ROLE_AGENTGP');
  }

  redirectToLogin(): void {
    this.showLoginDialog = false;
    this.router.navigate(['/login']); // adapte le chemin si besoin
  }
}
