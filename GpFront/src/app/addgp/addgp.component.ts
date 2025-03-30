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
import { GpService } from '../services/gp.service';
import { NgIf } from '@angular/common';
import { Programmegp } from '../model/Programmegp';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-addgp',
  standalone: true,
  imports: [ReactiveFormsModule, MenuComponent, InputTextModule, InputNumberModule, CalendarModule, ButtonModule, MessageModule, NgIf, FooterComponent],
  templateUrl: './addgp.component.html',
  styleUrl: './addgp.component.css'
})
export class AddgpComponent implements OnInit {
  @Input() existingProgram: Programmegp | null = null;
  gpForm: FormGroup;
  responseMessage: string = '';
  messageType: 'success' | 'error' = 'success';
  programmeId: number | null = null;

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

          this.gpForm.patchValue({
            description: program.description,
            depart: program.depart,
            destination: program.destination,
            prix: program.prix,
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

    const programData = {
      ...this.gpForm.value,
      agentGp: { id: this.authService.getUserId() }
    };

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
