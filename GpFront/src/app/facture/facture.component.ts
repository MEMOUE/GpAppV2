import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import SignaturePad from 'signature_pad';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

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
    ProgressSpinnerModule,
    CardModule,
    DividerModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.css'],
})
export class FactureComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef;

  // Destruction subject pour unsubscribe
  private destroy$ = new Subject<void>();

  // Form et données
  factureForm!: FormGroup;
  programmes: Programmegp[] = [];
  selectedProgramme: Programmegp | null = null;

  // Signature
  signaturePad!: SignaturePad;
  signatureData: string = '';
  signatureRequired: boolean = true;

  // État du composant
  factureGeneree: boolean = false;
  factureCreee: FactureResponse | null = null;
  showShareOptions: boolean = false;
  isLoading: boolean = false;
  isInitializing: boolean = true;

  // Validation states
  formSubmitted: boolean = false;
  signatureError: string = '';

  // Services injectés
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private factureService = inject(FactureService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private trackingService = inject(TrackingService);

  private readonly apiURL = `${environment.apiUrl}`;

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngAfterViewInit(): void {
    // Délai pour s'assurer que la vue est complètement initialisée
    setTimeout(() => {
      this.initializeSignaturePad();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Nettoyer les ressources
    if (this.signaturePad) {
      this.signaturePad.off();
    }
  }

  // ===== INITIALIZATION =====

  private initializeComponent(): void {
    this.initializeForm();
    this.loadProgrammes();
    this.setupFormSubscriptions();
    this.trackingService.trackUserAction('Facture Creation Page');
  }

  private initializeForm(): void {
    this.factureForm = this.fb.group({
      programme: [null, [Validators.required]],
      nomClient: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      adresseClient: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      laveurBagage: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      nombreKg: [null, [Validators.required, Validators.min(1), Validators.max(1000)]],
      prixTransport: [{ value: '0 €', disabled: true }],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  private setupFormSubscriptions(): void {
    // Écouter les changements sur le nombre de KG
    this.factureForm.get('nombreKg')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerPrixTransport();
      });

    // Écouter les changements sur le programme
    this.factureForm.get('programme')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onProgrammeChange();
      });
  }

  private initializeSignaturePad(): void {
    if (this.signatureCanvas?.nativeElement) {
      try {
        this.signaturePad = new SignaturePad(this.signatureCanvas.nativeElement, {
          backgroundColor: 'rgba(255, 255, 255, 1)',
          penColor: 'rgb(0, 0, 0)',
          minWidth: 0.5,
          maxWidth: 2.5,
          throttle: 16,
          minDistance: 5,
          velocityFilterWeight: 0.7
        });

        // Configurer les événements
        this.signaturePad.addEventListener('endStroke', () => {
          this.captureSignature();
          this.validateSignature();
        });

        this.signaturePad.addEventListener('beginStroke', () => {
          this.signatureError = '';
        });

        // Redimensionner le canvas
        this.resizeCanvas();

        // Écouter les redimensionnements de fenêtre
        window.addEventListener('resize', () => this.resizeCanvas());

      } catch (error) {
        console.error('Erreur lors de l\'initialisation du pad de signature:', error);
        this.messageService.add({
          severity: 'warn',
          summary: 'Signature',
          detail: 'Problème d\'initialisation de la signature. Veuillez recharger la page.'
        });
      }
    }
  }

  private resizeCanvas(): void {
    if (!this.signatureCanvas?.nativeElement || !this.signaturePad) return;

    const canvas = this.signatureCanvas.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Sauvegarder la signature existante
    const signatureData = this.signaturePad.isEmpty() ? null : this.signaturePad.toDataURL();

    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    // Restaurer la signature si elle existait
    if (signatureData) {
      this.signaturePad.fromDataURL(signatureData);
    } else {
      this.signaturePad.clear();
    }
  }

  private captureSignature(): void {
    if (!this.signaturePad) return;

    if (!this.signaturePad.isEmpty()) {
      this.signatureData = this.signaturePad.toDataURL('image/png');
    } else {
      this.signatureData = '';
    }
  }

  private validateSignature(): void {
    if (this.formSubmitted && (!this.signatureData || this.signaturePad?.isEmpty())) {
      this.signatureError = 'La signature est requise';
    } else {
      this.signatureError = '';
    }
  }

  // ===== DATA LOADING =====

  private loadProgrammes(): void {
    this.isLoading = true;
    this.isInitializing = true;

    this.http.get<Programmegp[]>(`${this.apiURL}programmegp/mylist`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (programmes) => {
          this.programmes = programmes;
          this.isLoading = false;
          this.isInitializing = false;

          if (programmes.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Aucun programme',
              detail: 'Vous devez d\'abord créer un programme GP avant de pouvoir créer une facture.',
              life: 6000
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Programmes chargés',
              detail: `${programmes.length} programme(s) disponible(s)`,
              life: 3000
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.isInitializing = false;
          console.error('Erreur lors du chargement des programmes:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur de chargement',
            detail: 'Impossible de charger vos programmes. Veuillez réessayer.',
            life: 6000
          });
        }
      });
  }

  // ===== FORM HANDLING =====

  onProgrammeChange(): void {
    const selectedId = this.factureForm.get('programme')?.value;
    this.selectedProgramme = this.programmes.find(p => p.id === selectedId) || null;

    if (this.selectedProgramme) {
      this.calculerPrixTransport();

      this.messageService.add({
        severity: 'info',
        summary: 'Programme sélectionné',
        detail: `${this.selectedProgramme.depart} → ${this.selectedProgramme.destination}`,
        life: 3000
      });

      // Reset les erreurs du programme
      this.factureForm.get('programme')?.setErrors(null);
    } else {
      // Reset le prix si aucun programme sélectionné
      this.factureForm.patchValue({ prixTransport: '0 €' });
    }
  }

  calculerPrixTransport(): void {
    const nombreKg = this.factureForm.get('nombreKg')?.value;

    if (this.selectedProgramme && nombreKg && nombreKg > 0) {
      try {
        // Extraire la valeur numérique et la devise du prix du programme
        const prixUnitaireStr = this.selectedProgramme.prix;
        const valeurUnitaire = this.factureService.extractNumericalValue(prixUnitaireStr);
        const devise = this.factureService.extractDevise(prixUnitaireStr) || '€';

        // Calculer le prix total
        const prixTotal = valeurUnitaire * nombreKg;
        const prixTotalFormate = `${prixTotal.toFixed(2)} ${devise}`;

        this.factureForm.patchValue({
          prixTransport: prixTotalFormate
        });

        // Log pour debug
        console.log('Calcul prix:', {
          prixUnitaire: prixUnitaireStr,
          valeurUnitaire,
          devise,
          nombreKg,
          prixTotal: prixTotalFormate
        });

      } catch (error) {
        console.error('Erreur lors du calcul du prix:', error);
        const devise = this.getDeviseFromProgramme();
        this.factureForm.patchValue({ prixTransport: `0.00 ${devise}` });
      }
    } else {
      // Garder la devise du programme ou utiliser € par défaut
      const devise = this.getDeviseFromProgramme();
      this.factureForm.patchValue({
        prixTransport: `0.00 ${devise}`
      });
    }
  }

  // ===== SIGNATURE HANDLING =====

  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      this.signatureData = '';
      this.signatureError = '';

      this.messageService.add({
        severity: 'info',
        summary: 'Signature effacée',
        detail: 'Vous pouvez signer à nouveau',
        life: 2000
      });
    }
  }

  // ===== INVOICE GENERATION =====

  generateInvoice(): void {
    this.formSubmitted = true;
    this.validateSignature();

    // Validation du formulaire
    if (!this.factureForm.valid) {
      this.markFormGroupTouched(this.factureForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire incomplet',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 5000
      });
      this.scrollToFirstError();
      return;
    }

    // Validation de la signature
    if (!this.signatureData || (this.signaturePad && this.signaturePad.isEmpty())) {
      this.signatureError = 'La signature est requise';
      this.messageService.add({
        severity: 'warn',
        summary: 'Signature requise',
        detail: 'Veuillez apposer votre signature avant de créer la facture',
        life: 5000
      });
      this.scrollToSignature();
      return;
    }

    // Validation des données métier
    if (!this.validateBusinessRules()) {
      return;
    }

    this.createInvoice();
  }

  private validateBusinessRules(): boolean {
    const nombreKg = this.factureForm.get('nombreKg')?.value;
    const prixTransport = this.factureForm.get('prixTransport')?.value;

    // Vérifier que le prix n'est pas zéro
    const prixNumerique = this.factureService.extractNumericalValue(prixTransport);
    if (prixNumerique <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Prix invalide',
        detail: 'Le prix total doit être supérieur à zéro',
        life: 5000
      });
      return false;
    }

    // Vérifier la cohérence du prix
    if (this.selectedProgramme) {
      const prixUnitaireAttendu = this.factureService.extractNumericalValue(this.selectedProgramme.prix);
      const prixCalcule = prixUnitaireAttendu * nombreKg;
      const difference = Math.abs(prixNumerique - prixCalcule);

      if (difference > 0.01) { // Tolérance de 1 centime
        this.messageService.add({
          severity: 'warn',
          summary: 'Incohérence de prix',
          detail: 'Le prix calculé ne correspond pas au prix unitaire du programme',
          life: 5000
        });
      }
    }

    return true;
  }

  private createInvoice(): void {
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

    // Log pour debug
    console.log('Création facture:', factureRequest);

    // Créer la facture
    this.factureService.creerFacture(factureRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facture) => {
          this.factureCreee = facture;
          this.factureGeneree = true;
          this.isLoading = false;
          this.formSubmitted = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Facture créée',
            detail: `Facture ${facture.numeroFacture} créée avec succès!`,
            life: 6000
          });

          // Track success
          this.trackingService.trackUserAction('Facture Created Successfully');

          // Scroll vers le haut pour voir le résultat
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          console.error('Erreur lors de la création de la facture:', error);

          let errorMessage = 'Impossible de créer la facture';

          if (error.status === 400) {
            errorMessage = error.error?.message || 'Données invalides';
          } else if (error.status === 403) {
            errorMessage = 'Vous n\'avez pas les droits pour créer une facture';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur de création',
            detail: errorMessage,
            life: 8000
          });
        }
      });
  }

  // ===== INVOICE ACTIONS =====

  downloadPDF(): void {
    if (!this.factureCreee) return;

    this.isLoading = true;

    this.factureService.downloadPDF(this.factureCreee.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pdfBlob) => {
          this.factureService.saveFacturePDF(this.factureCreee!, pdfBlob);
          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Téléchargement réussi',
            detail: 'Le PDF a été téléchargé avec succès',
            life: 4000
          });

          this.trackingService.trackUserAction('Facture PDF Downloaded');
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          console.error('Erreur lors du téléchargement:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur de téléchargement',
            detail: error.message || 'Impossible de télécharger le PDF',
            life: 6000
          });
        }
      });
  }

  previewPDF(): void {
    if (!this.factureCreee) return;

    this.factureService.previewPDF(this.factureCreee.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pdfBlob) => {
          const pdfUrl = URL.createObjectURL(pdfBlob);
          const previewWindow = window.open(pdfUrl, '_blank');

          if (previewWindow) {
            previewWindow.onload = () => {
              URL.revokeObjectURL(pdfUrl);
            };
          }

          this.messageService.add({
            severity: 'info',
            summary: 'Prévisualisation',
            detail: 'PDF ouvert dans un nouvel onglet',
            life: 3000
          });

          this.trackingService.trackUserAction('Facture PDF Previewed');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de la prévisualisation:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur de prévisualisation',
            detail: error.message || 'Impossible de prévisualiser le PDF',
            life: 6000
          });
        }
      });
  }

  printInvoice(): void {
    if (!this.factureCreee) return;

    this.factureService.imprimerFacture(this.factureCreee.id)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Impression lancée',
          detail: 'La fenêtre d\'impression s\'est ouverte',
          life: 4000
        });

        this.trackingService.trackUserAction('Facture Printed');
      })
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur d\'impression',
          detail: error.message || 'Impossible d\'imprimer la facture',
          life: 6000
        });
      });
  }

  marquerPayee(): void {
    if (!this.factureCreee || this.factureCreee.statut === 'PAYEE') return;

    this.factureService.marquerPayee(this.factureCreee.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facture) => {
          this.factureCreee = facture;

          this.messageService.add({
            severity: 'success',
            summary: 'Statut mis à jour',
            detail: 'Facture marquée comme payée',
            life: 4000
          });

          this.trackingService.trackUserAction('Facture Marked as Paid');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de la mise à jour du statut:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur de mise à jour',
            detail: error.message || 'Impossible de mettre à jour le statut',
            life: 6000
          });
        }
      });
  }

  // ===== SHARING ACTIONS =====

  toggleShareOptions(): void {
    this.showShareOptions = !this.showShareOptions;
  }

  shareViaWhatsApp(): void {
    if (this.factureCreee) {
      this.factureService.partagerWhatsApp(this.factureCreee);

      this.messageService.add({
        severity: 'info',
        summary: 'Partage WhatsApp',
        detail: 'Lien WhatsApp ouvert',
        life: 3000
      });

      this.trackingService.trackUserAction('Facture Shared via WhatsApp');
    }
  }

  shareViaEmail(): void {
    if (this.factureCreee) {
      this.factureService.partagerEmail(this.factureCreee);

      this.messageService.add({
        severity: 'info',
        summary: 'Partage Email',
        detail: 'Client email ouvert',
        life: 3000
      });

      this.trackingService.trackUserAction('Facture Shared via Email');
    }
  }

  // ===== NAVIGATION AND RESET =====

  createNewInvoice(): void {
    this.factureGeneree = false;
    this.factureCreee = null;
    this.showShareOptions = false;
    this.formSubmitted = false;
    this.signatureError = '';
    this.resetForm();

    this.messageService.add({
      severity: 'info',
      summary: 'Nouveau formulaire',
      detail: 'Prêt pour une nouvelle facture',
      life: 3000
    });

    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      prixTransport: '0 €'
    });

    // Reset validation states
    this.markFormGroupUntouched(this.factureForm);
  }

  // ===== HELPER METHODS =====

  formatPrixDisplay(prix: string): string {
    return this.factureService.formatPrix(prix);
  }

  getPrixTotalDisplay(): string {
    const prixTransport = this.factureForm.get('prixTransport')?.value;
    return prixTransport ? this.factureService.formatPrix(prixTransport) : '0 €';
  }

  getDeviseFromProgramme(): string {
    if (this.selectedProgramme) {
      return this.factureService.extractDevise(this.selectedProgramme.prix) || '€';
    }
    return '€';
  }

  getPrixNumerique(): number {
    const prixTransport = this.factureForm.get('prixTransport')?.value;
    return prixTransport ? this.factureService.extractNumericalValue(prixTransport) : 0;
  }

  getStatutColor(): 'success' | 'info' | 'secondary' | 'contrast' | 'warning' | 'danger' | undefined {
    if (!this.factureCreee) return 'info';
    return this.factureService.getStatutColor(this.factureCreee.statut) as
      'success' | 'info' | 'secondary' | 'contrast' | 'warning' | 'danger' | undefined;
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

  // ===== VALIDATION HELPERS =====

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private markFormGroupUntouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsUntouched();
      control?.setErrors(null);

      if (control instanceof FormGroup) {
        this.markFormGroupUntouched(control);
      }
    });
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = document.querySelector('.ng-invalid');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  private scrollToSignature(): void {
    if (this.signatureCanvas?.nativeElement) {
      this.signatureCanvas.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  // ===== VALIDATION GETTERS =====

  get nomClientError(): string {
    const control = this.factureForm.get('nomClient');
    if (control?.hasError('required') && control?.touched) {
      return 'Le nom du client est requis';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Le nom doit faire au moins 2 caractères';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Le nom ne peut pas dépasser 100 caractères';
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
    if (control?.hasError('maxlength') && control?.touched) {
      return 'L\'adresse ne peut pas dépasser 200 caractères';
    }
    return '';
  }

  get laveurBagageError(): string {
    const control = this.factureForm.get('laveurBagage');
    if (control?.hasError('required') && control?.touched) {
      return 'La valeur du bagage est requise';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'La valeur doit faire au moins 2 caractères';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'La valeur ne peut pas dépasser 100 caractères';
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

  // ===== UTILITY GETTERS =====

  get canCreateInvoice(): boolean {
    return this.factureForm.valid &&
      !!this.signatureData &&
      !this.isLoading &&
      !!this.selectedProgramme;
  }

  get isFormDisabled(): boolean {
    return this.isLoading || this.isInitializing;
  }

  get currentCharacterCount(): number {
    return this.factureForm.get('notes')?.value?.length || 0;
  }

  get calculatedTotalDisplay(): string {
    if (!this.selectedProgramme) return '0 €';

    const nombreKg = this.factureForm.get('nombreKg')?.value || 0;
    const prixUnitaire = this.selectedProgramme.prix;

    return this.factureService.calculatePrixTotal(prixUnitaire, nombreKg);
  }
}
