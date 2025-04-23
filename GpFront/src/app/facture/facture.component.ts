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
import jsPDF from 'jspdf';
import {TrackingService} from '../services/tracking-service.service';

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
    MenuComponent,
  ],
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
  factureData: any = null;
  pdfBlobUrl: string | null = null;
  showShareOptions: boolean = false;

  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  constructor(
    private trackingService: TrackingService,
  ) {
  }

  ngOnInit() {
    this.factureForm = this.fb.group({
      programme: [null, Validators.required],
      nomClient: ['', Validators.required],
      adresseClient: ['', Validators.required],
      laveurBagage: ['', Validators.required],
      nombreKg: [null, [Validators.required, Validators.min(1)]],
      prixTransport: [{ value: null, disabled: true }, [Validators.required, Validators.min(0)]],
      signature: ['', Validators.required],
    });

    this.fetchProgrammes();
    this.trackingService.trackUserAction('Facture Page ');
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
    this.http.get<Programmegp[]>('http://147.79.101.109/api/programmegp/mylist').subscribe(
      (data) => (this.programmes = data),
      (error) => console.error('Erreur de récupération des programmes:', error)
    );
  }

  onProgrammeChange() {
    const selectedId = this.factureForm.get('programme')?.value;
    this.selectedProgramme = this.programmes.find((p) => p.id === selectedId) || null;
    this.calculerPrixTransport();
  }

  calculerPrixTransport() {
    const kg = this.factureForm.get('nombreKg')?.value;
    if (this.selectedProgramme && kg > 0) {
      const prixTotal = this.selectedProgramme.prix * kg;
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
      this.factureData = { ...this.factureForm.value, signature: this.signatureData };
      console.log('Facture générée:', this.factureData);
      this.factureGeneree = true;
      this.generatePDF();
      alert('Facture générée avec succès!');
    } else {
      alert('Veuillez remplir tous les champs et signer.');
    }
  }

  generatePDF() {
    const doc = new jsPDF();

    // const logoUrl = '/logo.png';

    // doc.addImage(logoUrl, 'PNG', 10, 10, 50, 20);
    const logo = '/logo.png';

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Facture', 80, 20);

    const programme = this.factureData.programme;
    if (programme && programme.agentGp) {
      const agence = programme.agentGp;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Agence: ${agence.nomagence}`, 10, 40);
      doc.text(`Adresse: ${agence.adresse}`, 10, 50);
      doc.text(`Téléphone: ${agence.telephone}`, 10, 60);
      doc.text(`Email: ${agence.email}`, 10, 70);
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, 75, 200, 75);

    if (programme) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Détails du Programme', 10, 85);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Programme: ${programme.description}`, 10, 95);
      doc.text(`Départ: ${programme.depart}`, 10, 105);
      doc.text(`Destination: ${programme.destination}`, 10, 115);
      doc.text(`Prix par KG: ${programme.prix} €`, 10, 125);
      doc.text(`Garantie: ${programme.garantie} %`, 10, 135);
      doc.text(`Date limite: ${programme.dateline}`, 10, 145);
    }

    // Ligne séparatrice
    doc.line(10, 150, 200, 150);

    // Détails du client
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Détails du Client', 10, 160);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom du client: ${this.factureData.nomClient}`, 10, 170);
    doc.text(`Adresse du client: ${this.factureData.adresseClient}`, 10, 180);
    doc.text(`Laveur de bagage: ${this.factureData.laveurBagage}`, 10, 190);
    doc.text(`Nombre de KG: ${this.factureData.nombreKg}`, 10, 200);
    doc.text(`Prix du transport: ${this.factureData.prixTransport} €`, 10, 210);

    doc.line(10, 215, 200, 215);

    if (this.signatureData) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Signature de l\'Agence', 10, 225);

      const imgData = this.signatureData;
      doc.addImage(imgData, 'PNG', 10, 230, 50, 20);
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');

    doc.text('Merci de faire confiance à GPMonde pour vos transports internationaux.', 10, 260);
    doc.text('Visitez notre site web: www.gpmonde.com', 10, 265);

    const text = 'Visitez notre site web: www.gpmonde.com';
    const textWidth = doc.getTextWidth(text);
    const logoX = 10 + textWidth + 2;
    const logoY = 265 - 5;

    doc.addImage(logo, 'PNG', logoX, logoY, 30, 20);


    const pdfBlob = doc.output('blob');
    this.pdfBlobUrl = URL.createObjectURL(pdfBlob);
  }


  downloadPDF() {
    if (this.pdfBlobUrl) {
      const a = document.createElement('a');
      a.href = this.pdfBlobUrl;
      a.download = 'facture.pdf';
      a.click();
    }
  }

  shareViaWhatsApp() {
    if (this.pdfBlobUrl) {
      const message = `Voici votre facture: ${this.factureData.nomClient}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }

  shareViaEmail() {
    if (this.pdfBlobUrl) {
      const subject = 'Votre facture';
      const body = `Bonjour, voici votre facture en pièce jointe.`;
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, '_blank');
    }
  }

  toggleShareOptions() {
    this.showShareOptions = !this.showShareOptions;
  }
}
