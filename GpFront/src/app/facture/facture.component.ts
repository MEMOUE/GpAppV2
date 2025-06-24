import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import SignaturePad from 'signature_pad';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MenuComponent } from '../menu/menu.component';
import { Programmegp } from '../model/Programmegp';
import { TrackingService } from '../services/tracking-service.service';
import { environment } from '../../environments/environment';
import { FactureService, FactureCreateRequest, FactureResponse, StatutFacture } from '../services/facture.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-facture',
  standalone: true,
  imports: [
    MenuComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
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
  factureForm!: FormGroup;
  programmes: Programmegp[] = [];
  selectedProgramme!: Programmegp | null;
  signaturePad!: SignaturePad;
  signatureData: string = '';
  factureGeneree: boolean = false;
  factureCreee: FactureResponse | null = null;
  showShareOptions: boolean = false;
  isLoading: boolean = false;
  private apiURL: string = `${environment.apiUrl}`;

  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private factureService = inject(FactureService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  constructor(
    private trackingService: TrackingService,
  ) {}

  ngOnInit() {
    this.factureForm = this.fb.group({
      programme: [null, Validators.required],
      nomClient: ['', Validators.required],
      adresseClient: ['', Validators.required],
      laveurBagage: ['', Validators.required],
      nombreKg: [null, [Validators.required, Validators.min(1)]],
      prixTransport: [{ value: null, disabled: true }, [Validators.required, Validators.min(0)]],
      notes: [''],
      signature: ['', Validators.required],
    });

    this.fetchProgrammes();
    this.trackingService.trackUserAction('Facture Page');
  }

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.signatureCanvas.nativeElement);

    // Capture automatique de la signature lorsque l'utilisateur termine de dessiner
    this.signaturePad.addEventListener('endStroke', () => {
      this.signatureData = this.signaturePad.toDataURL();
      this.factureForm.patchValue({ signature: this.signatureData });
    });
  }

  fetchProgrammes() {
    this.http.get<Programmegp[]>(`${this.apiURL}programmegp/mylist`).subscribe({
      next: (data) => {
        this.programmes = data;
      },
      error: (error) => {
        console.error('Erreur de récupération des programmes:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les programmes'
        });
      }
    });
  }

  onProgrammeChange() {
    const selectedId = this.factureForm.get('programme')?.value;
    this.selectedProgramme = this.programmes.find((p) => p.id === selectedId) || null;
    this.calculerPrixTransport();
  }

  calculerPrixTransport() {
    const kg = this.factureForm.get('nombreKg')?.value;
    if (this.selectedProgramme && kg > 0) {
      const prixTotal = parseFloat(this.selectedProgramme.prix) * kg;
      this.factureForm.patchValue({ prixTransport: prixTotal });
    }
  }

  clearSignature() {
    this.signaturePad.clear();
    this.signatureData = '';
    this.factureForm.patchValue({ signature: '' });
  }

  generateInvoice() {
    if (this.factureForm.valid && this.signatureData) {
      this.isLoading = true;

      const factureRequest: FactureCreateRequest = {
        programmeId: this.factureForm.get('programme')?.value,
        nomClient: this.factureForm.get('nomClient')?.value,
        adresseClient: this.factureForm.get('adresseClient')?.value,
        laveurBagage: this.factureForm.get('laveurBagage')?.value,
        nombreKg: this.factureForm.get('nombreKg')?.value,
        prixTransport: this.factureForm.get('prixTransport')?.value,
        signatureBase64: this.signatureData,
        notes: this.factureForm.get('notes')?.value
      };

      this.factureService.creerFacture(factureRequest).subscribe({
        next: (facture) => {
          this.factureCreee = facture;
          this.factureGeneree = true;
          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: `Facture ${facture.numeroFacture} créée avec succès!`
          });

          // Réinitialiser le formulaire
          this.resetForm();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur lors de la création de la facture:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la création de la facture'
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs et signer'
      });
    }
  }

  downloadPDF() {
    if (this.factureCreee) {
      this.isLoading = true;

      this.factureService.downloadPDF(this.factureCreee.id).subscribe({
        next: (pdfBlob) => {
          this.factureService.saveFacturePDF(this.factureCreee!, pdfBlob);
          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Facture téléchargée avec succès'
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur lors du téléchargement:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors du téléchargement du PDF'
          });
        }
      });
    }
  }

  printInvoice() {
    if (this.factureCreee) {
      this.factureService.imprimerFacture(this.factureCreee.id);
    }
  }

  shareViaWhatsApp() {
    if (this.factureCreee) {
      this.factureService.partagerWhatsApp(this.factureCreee);
    }
  }

  shareViaEmail() {
    if (this.factureCreee) {
      this.factureService.partagerEmail(this.factureCreee);
    }
  }

  previewPDF() {
    if (this.factureCreee) {
      this.factureService.previewPDF(this.factureCreee.id).subscribe({
        next: (pdfBlob) => {
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
        },
        error: (error) => {
          console.error('Erreur lors de la prévisualisation:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la prévisualisation du PDF'
          });
        }
      });
    }
  }

  toggleShareOptions() {
    this.showShareOptions = !this.showShareOptions;
  }

  resetForm() {
    this.factureForm.reset();
    this.selectedProgramme = null;
    this.clearSignature();

    // Réinitialiser les valeurs par défaut
    this.factureForm.patchValue({
      programme: null,
      nombreKg: null,
      prixTransport: null
    });
  }

  createNewInvoice() {
    this.factureGeneree = false;
    this.factureCreee = null;
    this.showShareOptions = false;
    this.resetForm();
  }

  // Action simplifiée - un seul bouton pour marquer comme payée
  marquerPayee() {
    if (this.factureCreee && this.factureCreee.statut === 'NON_PAYEE') {
      this.factureService.marquerPayee(this.factureCreee.id).subscribe({
        next: (facture) => {
          this.factureCreee = facture;
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Facture marquée comme payée'
          });
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour du statut'
          });
        }
      });
    }
  }

  // Aller à la liste des factures
  goToFactureList() {
    this.router.navigate(['/list-facture']);
  }

  // Helpers pour l'affichage avec les nouveaux états
  getStatutColor(): string {
    if (!this.factureCreee) return '';
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

  // Vérifier si la facture est payée
  isFacturePayee(): boolean {
    return this.factureCreee?.statut === 'PAYEE';
  }

  // Vérifier si la facture est non payée
  isFactureNonPayee(): boolean {
    return this.factureCreee?.statut === 'NON_PAYEE';
  }
}
