import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import SignaturePad from 'signature_pad';

// PrimeNG imports
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

// Local imports
import { MenuComponent } from '../menu/menu.component';
import { Programmegp } from '../model/Programmegp';
import { TrackingService } from '../services/tracking-service.service';
import { environment } from '../../environments/environment';
import { FactureService, FactureCreateRequest, FactureResponse } from '../services/facture.service';

@Component({
  selector: 'app-facture',
  standalone: true,
  imports: [
    MenuComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.css'],
})
export class FactureComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef;

  // Form et données
  factureForm!: FormGroup;
  programmes: Programmegp[] = [];
  selectedProgramme: Programmegp | null = null;

  // Signature
  signaturePad!: SignaturePad;
  signatureData: string = '';

  // État du composant
  factureGeneree: boolean = false;
  factureCreee: FactureResponse | null = null;
  showShareOptions: boolean = false;
  isLoading: boolean = false;

  // Services injectés
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private factureService = inject(FactureService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private trackingService = inject(TrackingService);

  private readonly apiURL = `${environment.apiUrl}`;

  ngOnInit(): void {
    this.initializeForm();
    this.loadProgrammes();
    this.trackingService.trackUserAction('Facture Creation Page');
  }

  private initializeForm(): void {
    this.factureForm = this.fb.group({
      programme: [null, Validators.required],
      nomClient: ['', [Validators.required, Validators.minLength(2)]],
      adresseClient: ['', [Validators.required, Validators.minLength(5)]],
      laveurBagage: ['', [Validators.required, Validators.minLength(2)]],
      nombreKg: [null, [Validators.required, Validators.min(1), Validators.max(1000)]],
      prixTransport: [{ value: null, disabled: true }],
      notes: ['', Validators.maxLength(500)]
    });

    // Écouter les changements sur le nombre de KG pour recalculer automatiquement
    this.factureForm.get('nombreKg')?.valueChanges.subscribe(() => {
      this.calculerPrixTransport();
    });
  }

  ngAfterViewInit(): void {
    this.initializeSignaturePad();
  }



  private initializeSignaturePad(): void {
    if (this.signatureCanvas?.nativeElement) {
      this.signaturePad = new SignaturePad(this.signatureCanvas.nativeElement, {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16,
        minDistance: 5
      });

      // Configurer les événements
      this.signaturePad.addEventListener('endStroke', () => {
        this.captureSignature();
      });

      // Redimensionner le canvas
      this.resizeCanvas();
    }
  }

  private resizeCanvas(): void {
    const canvas = this.signatureCanvas.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    this.signaturePad.clear();
  }

  private captureSignature(): void {
    if (!this.signaturePad.isEmpty()) {
      this.signatureData = this.signaturePad.toDataURL('image/png');
    } else {
      this.signatureData = '';
    }
  }

  private loadProgrammes(): void {
    this.isLoading = true;

    this.http.get<Programmegp[]>(`${this.apiURL}programmegp/mylist`).subscribe({
      next: (programmes) => {
        this.programmes = programmes;
        this.isLoading = false;

        if (programmes.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aucun programme',
            detail: 'Vous devez d\'abord créer un programme GP'
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur lors du chargement des programmes:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger vos programmes'
        });
      }
    });
  }

  onProgrammeChange(): void {
    const selectedId = this.factureForm.get('programme')?.value;
    this.selectedProgramme = this.programmes.find(p => p.id === selectedId) || null;

    if (this.selectedProgramme) {
      this.calculerPrixTransport();

      this.messageService.add({
        severity: 'info',
        summary: 'Programme sélectionné',
        detail: `${this.selectedProgramme.depart} → ${this.selectedProgramme.destination}`
      });
    }
  }

  calculerPrixTransport(): void {
    const nombreKg = this.factureForm.get('nombreKg')?.value;

    if (this.selectedProgramme && nombreKg && nombreKg > 0) {
      const prixUnitaire = parseFloat(this.selectedProgramme.prix) || 0;
      const prixTotal = prixUnitaire * nombreKg;

      this.factureForm.patchValue({
        prixTransport: Math.round(prixTotal * 100) / 100
      });
    } else {
      this.factureForm.patchValue({ prixTransport: 0 });
    }
  }

  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      this.signatureData = '';

      this.messageService.add({
        severity: 'info',
        summary: 'Signature effacée',
        detail: 'Vous pouvez signer à nouveau'
      });
    }
  }

  generateInvoice(): void {
    // Validation du formulaire
    if (!this.factureForm.valid) {
      this.markFormGroupTouched(this.factureForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire incomplet',
        detail: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    // Validation de la signature
    if (!this.signatureData || this.signaturePad.isEmpty()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Signature requise',
        detail: 'Veuillez apposer votre signature'
      });
      return;
    }

    this.isLoading = true;

    // Préparer les données de la facture
    const factureRequest: FactureCreateRequest = {
      programmeId: this.factureForm.get('programme')?.value,
      nomClient: this.factureForm.get('nomClient')?.value.trim(),
      adresseClient: this.factureForm.get('adresseClient')?.value.trim(),
      laveurBagage: this.factureForm.get('laveurBagage')?.value.trim(),
      nombreKg: this.factureForm.get('nombreKg')?.value,
      prixTransport: this.factureForm.get('prixTransport')?.value,
      signatureBase64: this.signatureData,
      notes: this.factureForm.get('notes')?.value?.trim() || undefined
    };

    // Créer la facture
    this.factureService.creerFacture(factureRequest).subscribe({
      next: (facture) => {
        this.factureCreee = facture;
        this.factureGeneree = true;
        this.isLoading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Facture créée',
          detail: `Facture ${facture.numeroFacture} créée avec succès!`,
          life: 5000
        });

        // Track success
        this.trackingService.trackUserAction('Facture Created Successfully');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur lors de la création de la facture:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de création',
          detail: error.message || 'Impossible de créer la facture'
        });
      }
    });
  }

  // Actions sur la facture créée
  downloadPDF(): void {
    if (!this.factureCreee) return;

    this.isLoading = true;

    this.factureService.downloadPDF(this.factureCreee.id).subscribe({
      next: (pdfBlob) => {
        this.factureService.saveFacturePDF(this.factureCreee!, pdfBlob);
        this.isLoading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Téléchargement réussi',
          detail: 'Le PDF a été téléchargé avec succès'
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur lors du téléchargement:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de téléchargement',
          detail: error.message || 'Impossible de télécharger le PDF'
        });
      }
    });
  }

  previewPDF(): void {
    if (!this.factureCreee) return;

    this.factureService.previewPDF(this.factureCreee.id).subscribe({
      next: (pdfBlob) => {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');

        this.messageService.add({
          severity: 'info',
          summary: 'Prévisualisation',
          detail: 'PDF ouvert dans un nouvel onglet'
        });
      },
      error: (error) => {
        console.error('Erreur lors de la prévisualisation:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de prévisualisation',
          detail: error.message || 'Impossible de prévisualiser le PDF'
        });
      }
    });
  }

  printInvoice(): void {
    if (!this.factureCreee) return;

    this.factureService.imprimerFacture(this.factureCreee.id).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Impression lancée',
        detail: 'La fenêtre d\'impression s\'est ouverte'
      });
    }).catch((error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur d\'impression',
        detail: error.message || 'Impossible d\'imprimer la facture'
      });
    });
  }

  marquerPayee(): void {
    if (!this.factureCreee || this.factureCreee.statut === 'PAYEE') return;

    this.factureService.marquerPayee(this.factureCreee.id).subscribe({
      next: (facture) => {
        this.factureCreee = facture;

        this.messageService.add({
          severity: 'success',
          summary: 'Statut mis à jour',
          detail: 'Facture marquée comme payée'
        });
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de mise à jour',
          detail: error.message || 'Impossible de mettre à jour le statut'
        });
      }
    });
  }

  // Actions de partage
  toggleShareOptions(): void {
    this.showShareOptions = !this.showShareOptions;
  }

  shareViaWhatsApp(): void {
    if (this.factureCreee) {
      this.factureService.partagerWhatsApp(this.factureCreee);

      this.messageService.add({
        severity: 'info',
        summary: 'Partage WhatsApp',
        detail: 'Lien WhatsApp ouvert'
      });
    }
  }

  shareViaEmail(): void {
    if (this.factureCreee) {
      this.factureService.partagerEmail(this.factureCreee);

      this.messageService.add({
        severity: 'info',
        summary: 'Partage Email',
        detail: 'Client email ouvert'
      });
    }
  }

  // Navigation et reset
  createNewInvoice(): void {
    this.factureGeneree = false;
    this.factureCreee = null;
    this.showShareOptions = false;
    this.resetForm();

    this.messageService.add({
      severity: 'info',
      summary: 'Nouveau formulaire',
      detail: 'Prêt pour une nouvelle facture'
    });
  }

  goToFactureList(): void {
    this.router.navigate(['/list-facture']);
  }

  private resetForm(): void {
    this.factureForm.reset();
    this.selectedProgramme = null;
    this.clearSignature();

    // Réinitialiser les valeurs par défaut
    this.factureForm.patchValue({
      programme: null,
      nombreKg: null,
      prixTransport: 0
    });
  }

  // Helpers pour l'affichage
  getStatutColor(): string {
    if (!this.factureCreee) return 'info';
    return this.factureService.getStatutColor(this.factureCreee.statut);
  }

  getStatutLabel(): string {
    if (!this.factureCreee) return '';
    return this.factureService.getStatutLabel(this.factureCreee.statut);
  }

  getStatutIcon(): string {
    if (!this.factureCreee) return '';
    return this.factureService.getStatutIcon(this.factureCreee.statut);
  }

  isFacturePayee(): boolean {
    return this.factureCreee?.statut === 'PAYEE';
  }

  isFactureNonPayee(): boolean {
    return this.factureCreee?.statut === 'NON_PAYEE';
  }

  // Validation helper
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getters pour les erreurs de validation
  get nomClientError(): string {
    const control = this.factureForm.get('nomClient');
    if (control?.hasError('required') && control?.touched) {
      return 'Le nom du client est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le nom doit faire au moins 2 caractères';
    }
    return '';
  }

  get adresseClientError(): string {
    const control = this.factureForm.get('adresseClient');
    if (control?.hasError('required') && control?.touched) {
      return 'L\'adresse du client est requise';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'L\'adresse doit faire au moins 5 caractères';
    }
    return '';
  }

  get laveurBagageError(): string {
    const control = this.factureForm.get('laveurBagage');
    if (control?.hasError('required') && control?.touched) {
      return 'Le nom du laveur est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le nom doit faire au moins 2 caractères';
    }
    return '';
  }

  get nombreKgError(): string {
    const control = this.factureForm.get('nombreKg');
    if (control?.hasError('required') && control?.touched) {
      return 'Le nombre de KG est requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'Le poids minimum est de 1 KG';
    }
    if (control?.hasError('max') && control?.touched) {
      return 'Le poids maximum est de 1000 KG';
    }
    return '';
  }

  get programmeError(): string {
    const control = this.factureForm.get('programme');
    if (control?.hasError('required') && control?.touched) {
      return 'Veuillez sélectionner un programme';
    }
    return '';
  }

  get notesError(): string {
    const control = this.factureForm.get('notes');
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Les notes ne peuvent pas dépasser 500 caractères';
    }
    return '';
  }
}
