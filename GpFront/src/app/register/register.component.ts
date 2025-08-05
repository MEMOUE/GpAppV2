import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterService } from '../services/register.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe, TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import {CheckboxModule} from 'primeng/checkbox';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, TranslatePipe, TranslateModule, ButtonModule, InputTextModule, MessageModule, CheckboxModule],
  templateUrl: './register.component.html',
  standalone: true,
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registrationForm: FormGroup;
  isAgentGp = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  // Gestion des fichiers
  selectedFiles: { [key: string]: File } = {};
  fileErrors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private translate: TranslateService
  ) {
    this.registrationForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isAgentGp: [false],
      nomagence: [''],
      adresse: [''],
      telephone: [''],
      destinations: [[]],
    }, { validator: this.passwordMatchValidator });

    this.handleAgentGpToggle();
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  handleAgentGpToggle(): void {
    this.registrationForm.get('isAgentGp')?.valueChanges.subscribe((isChecked) => {
      this.isAgentGp = isChecked;

      if (isChecked) {
        this.registrationForm.get('nomagence')?.setValidators([Validators.required]);
        this.registrationForm.get('adresse')?.setValidators([Validators.required]);
        this.registrationForm.get('telephone')?.setValidators([Validators.required]);
      } else {
        this.registrationForm.get('nomagence')?.clearValidators();
        this.registrationForm.get('adresse')?.clearValidators();
        this.registrationForm.get('telephone')?.clearValidators();
        // Nettoyer les fichiers si on désélectionne agent GP
        this.selectedFiles = {};
        this.fileErrors = {};
      }

      this.registrationForm.get('nomagence')?.updateValueAndValidity();
      this.registrationForm.get('adresse')?.updateValueAndValidity();
      this.registrationForm.get('telephone')?.updateValueAndValidity();
    });
  }

  onFileSelected(fileType: string, event: any): void {
    const file = event.target.files[0];
    
    if (file) {
      // Validation du fichier
      const validationError = this.validateFile(file);
      
      if (validationError) {
        this.fileErrors[fileType] = validationError;
        delete this.selectedFiles[fileType];
      } else {
        this.selectedFiles[fileType] = file;
        delete this.fileErrors[fileType];
      }
    }
  }

  removeFile(fileType: string): void {
    delete this.selectedFiles[fileType];
    delete this.fileErrors[fileType];
    
    // Réinitialiser l'input file
    const fileInput = document.getElementById(fileType) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  validateFile(file: File): string | null {
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'Le fichier ne peut pas dépasser 5MB';
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Seuls les fichiers JPG, PNG et GIF sont acceptés';
    }

    return null;
  }

  // Méthode pour vérifier si le formulaire peut être soumis
  canSubmit(): boolean {
    if (!this.registrationForm.valid) {
      return false;
    }

    const isAgentGp = this.registrationForm.get('isAgentGp')?.value;
    
    if (isAgentGp) {
      // Pour les agents GP, vérifier que les fichiers sont présents et valides
      return this.selectedFiles['logo'] && 
             this.selectedFiles['carteIdentite'] && 
             Object.keys(this.fileErrors).length === 0;
    }

    return true;
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      this.registrationForm.get(key)?.markAsTouched();
    });
  }

  // Méthode pour obtenir les messages d'erreur traduits
  getErrorMessage(field: string): string {
    const control = this.registrationForm.get(field);
    if (control?.hasError('required')) {
      return this.translate.instant('registration.errors.required', { field: this.translate.instant(`registration.fields.${field}`) });
    }
    if (control?.hasError('minlength')) {
      return this.translate.instant('registration.errors.minlength', {
        field: this.translate.instant(`registration.fields.${field}`),
        minLength: control.errors?.['minlength'].requiredLength
      });
    }
    if (control?.hasError('email')) {
      return this.translate.instant('registration.errors.email');
    }
    if (control?.hasError('mismatch')) {
      return this.translate.instant('registration.errors.passwordMismatch');
    }
    return '';
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      if (this.registrationForm.get('isAgentGp')?.value) {
        if (!this.selectedFiles['logo'] || !this.selectedFiles['carteIdentite']) {
          this.errorMessage = 'Veuillez sélectionner le logo et la carte d\'identité pour les agents GP';
        } else if (Object.keys(this.fileErrors).length > 0) {
          this.errorMessage = 'Veuillez corriger les erreurs dans les fichiers';
        }
      } else {
        this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire';
      }
      this.markAllFieldsAsTouched();
      return;
    }

    const formData = { ...this.registrationForm.value };

    if (formData.destinations) {
      if (typeof formData.destinations === 'string') {
        formData.destinations = formData.destinations
          .split(',')
          .map((d: string) => d.trim());
      } else if (Array.isArray(formData.destinations)) {
        formData.destinations = formData.destinations.map((d: string) => d.trim());
      }
    }

    console.log('Données du formulaire:', formData);
    console.log('Fichiers sélectionnés:', this.selectedFiles);

    const apiCall = formData.isAgentGp
      ? this.registerService.registerAgent(formData, this.selectedFiles)
      : this.registerService.registerUser(formData);

    apiCall.subscribe({
      next: (response) => {
        console.log('Réponse du serveur:', response);
        this.successMessage = this.translate.instant('registration.successMessage');
        this.errorMessage = null;
        this.registrationForm.reset();
        this.selectedFiles = {};
        this.fileErrors = {};
      },
      error: (err) => {
        console.error('Erreur complète:', err);
        console.error('Status:', err.status);
        console.error('Error object:', err.error);
        this.successMessage = null;
        this.errorMessage = err?.error?.error || err?.error?.message || this.translate.instant('registration.errorMessage');
      }
    });
  }
}