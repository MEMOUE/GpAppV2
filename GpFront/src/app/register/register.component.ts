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

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private translate: TranslateService // <-- Injecté
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
      }

      this.registrationForm.get('nomagence')?.updateValueAndValidity();
      this.registrationForm.get('adresse')?.updateValueAndValidity();
      this.registrationForm.get('telephone')?.updateValueAndValidity();
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
    if (this.registrationForm.valid) {
      const formData = { ...this.registrationForm.value };

      if (formData.destinations) {
        if (typeof formData.destinations === 'string') {
          formData.destinations = formData.destinations
            .split(',')
            .map((d: string) => d.trim()); // Nettoyage des espaces
        } else if (Array.isArray(formData.destinations)) {
          formData.destinations = formData.destinations.map((d: string) => d.trim());
        }
      }

      const endpoint = formData.isAgentGp ? 'agentgp' : 'user';

      const apiCall = formData.isAgentGp
        ? this.registerService.registerAgent(formData)
        : this.registerService.registerUser(formData);

      apiCall.subscribe({
        next: (response) => {
          this.successMessage = this.translate.instant('registration.successMessage');
          this.errorMessage = null;
          this.registrationForm.reset();
        },
        error: (err) => {
          console.error('Erreur lors de l\'inscription :', err);
          this.successMessage = null;
          this.errorMessage = err?.error?.message || this.translate.instant('registration.errorMessage');
        }
      });
    } else {
      console.error('Formulaire invalide', this.registrationForm.errors);
      this.successMessage = null;
      this.errorMessage = this.translate.instant('registration.formErrorMessage');
    }
  }
}
