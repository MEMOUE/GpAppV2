import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DropdownModule } from 'primeng/dropdown';
import { GpService } from '../services/gp.service';
import { NgIf } from '@angular/common';
import { Programmegp } from '../model/Programmegp';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-addgp',
  standalone: true,
  imports: [ReactiveFormsModule, MenuComponent, InputTextModule, InputNumberModule, CalendarModule, ButtonModule, MessageModule, DropdownModule, NgIf, FooterComponent],
  templateUrl: './addgp.component.html',
  styleUrl: './addgp.component.css'
})
export class AddgpComponent implements OnInit {
  @Input() existingProgram: Programmegp | null = null;
  gpForm: FormGroup;
  responseMessage: string = '';
  messageType: 'success' | 'error' = 'success';
  programmeId: number | null = null;

  // Options de devises
  deviseOptions = [
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'GBP (£)', value: 'GBP' },
    { label: 'CHF', value: 'CHF' },
    { label: 'CAD', value: 'CAD' },
    { label: 'XOF (FCFA)', value: 'XOF' },
    { label: 'MAD', value: 'MAD' }
  ];

  constructor(
    private fb: FormBuilder,
    private gpService: GpService,
    private authService: AuthService,
    private route: ActivatedRoute // Pour récupérer les paramètres de l'URL
  ) {
    this.gpForm = this.fb.group({
      description: ['', Validators.required],
      depart: ['', Validators.required],
      destination: ['', Validators.required],
      prix: [null, [Validators.required, Validators.min(0)]],
      devise: ['EUR'], // Devise par défaut EUR, optionnelle
      garantie: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      dateline: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.programmeId = +id;
        this.loadProgram(this.programmeId);
      } else if (this.existingProgram) {
        this.gpForm.patchValue(this.existingProgram);
      }
    });
  }

  loadProgram(id: number): void {
    this.gpService.getById(id).subscribe(
      (program) => {
        if (program) {
          this.existingProgram = program;

          // Extraire la devise du prix s'il en contient une
          let prix: number = 0;
          let devise = 'EUR'; // valeur par défaut

          if (program.prix) {
            const prixString = program.prix.toString().trim();

            // Chercher si le prix contient une devise à la fin
            const deviseFound = this.deviseOptions.find(d => prixString.endsWith(d.value));

            if (deviseFound) {
              devise = deviseFound.value;
              // Extraire la partie numérique avant la devise
              const prixNumerique = prixString.replace(deviseFound.value, '').trim();
              prix = parseFloat(prixNumerique) || 0;
            } else {
              // Si pas de devise trouvée, considérer que c'est un nombre pur
              prix = parseFloat(prixString) || 0;
            }
          }

          this.gpForm.patchValue({
            description: program.description,
            depart: program.depart,
            destination: program.destination,
            prix: prix,
            devise: devise,
            garantie: program.garantie,
            dateline: program.dateline ? new Date(program.dateline) : null,
          });
        }
      },
      (error) => {
        console.error("Erreur lors du chargement du programme", error);
      }
    );
  }

  onSubmit(): void {
    if (this.gpForm.invalid) {
      this.responseMessage = "Veuillez remplir tous les champs correctement.";
      this.messageType = 'error';
      return;
    }

    const formValues = this.gpForm.value;

    // Concaténer le prix avec la devise : PRIX DEVISE
    const prixString = formValues.prix !== null && formValues.devise
      ? `${formValues.prix} ${formValues.devise}`
      : formValues.prix?.toString() || '';

    const programData = {
      ...this.gpForm.value,
      prix: prixString, // Prix sous forme de String : "25.50 EUR"
      agentGp: { id: this.authService.getUserId() }
    };

    // Supprimer le champ devise de l'objet envoyé au backend
    delete programData.devise;

    if (this.programmeId) {
      // Mise à jour
      programData.id = this.programmeId;
      this.gpService.updategp(programData).subscribe(
        () => {
          this.responseMessage = "Le programme a été mis à jour avec succès !";
          this.messageType = 'success';
        },
        (error) => {
          this.handleError(error);
        }
      );
    } else {
      // Ajout
      this.gpService.addgp(programData).subscribe(
        () => {
          this.responseMessage = "Le programme a été ajouté avec succès !";
          this.messageType = 'success';
          this.gpForm.reset();
          // Remettre la devise par défaut après reset
          this.gpForm.patchValue({ devise: 'EUR' });
        },
        (error) => {
          this.handleError(error);
        }
      );
    }
  }

  // Gestion des erreurs
  handleError(error: any) {
    if (error.status === 400) {
      this.responseMessage = "Erreur dans les données envoyées. Veuillez vérifier les champs.";
    } else if (error.status === 500) {
      this.responseMessage = "Erreur technique. Veuillez réessayer plus tard.";
    } else {
      this.responseMessage = "Une erreur inconnue est survenue.";
    }
    this.messageType = 'error';
  }
}
