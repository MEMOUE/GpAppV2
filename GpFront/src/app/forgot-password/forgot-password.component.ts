import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { NgIf } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Button,
    NgIf,
    TranslatePipe,
    InputTextModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: (response) => {
        console.log('Réponse du backend:', response);
        this.successMessage = response.message;
        this.errorMessage = '';
      },
      error: (err) => {
        console.error('Erreur backend:', err);
        this.errorMessage = 'Erreur lors de l’envoi de l’email. Vérifiez votre adresse.';
        this.successMessage = '';
      }
    });
  }


  getErrorMessage(field: string): string {
    const control = this.forgotForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Ce champ est obligatoire.';
    }
    if (control.hasError('email')) {
      return 'Veuillez entrer une adresse email valide.';
    }
    return '';
  }
}
