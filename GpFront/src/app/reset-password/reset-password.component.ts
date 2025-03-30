import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@ngx-translate/core';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    FormsModule,
    Button,
    ReactiveFormsModule,
    InputTextModule,
    TranslatePipe,
    NgIf
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(formGroup: FormGroup) {
    return formGroup.get('newPassword')?.value === formGroup.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  getErrorMessage(field: string): string {
    const control = this.resetPasswordForm.get(field);

    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }

    if (control?.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (this.resetPasswordForm.hasError('mismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }

    return '';
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) return;

    this.authService.resetPassword(this.token, this.resetPasswordForm.value.newPassword).subscribe({
      next: () => {
        this.successMessage = 'Votre mot de passe a été réinitialisé avec succès.';
        this.errorMessage = '';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la réinitialisation du mot de passe.';
        this.successMessage = '';
      }
    });
  }
}
