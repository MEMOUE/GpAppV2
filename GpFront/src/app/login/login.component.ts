import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [CommonModule, DividerModule, ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  email: string = '';
  password: string = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Nouveaux attributs pour la gestion des tentatives
  private maxAttempts = 3;
  private lockoutDuration = 10000; // 10 secondes
  private attemptCount = 0;
  private lockoutTimestamp: number | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {}


  private getRemainingLockoutTime(): number {
    if (!this.lockoutTimestamp) return 0;

    const currentTime = new Date().getTime();
    const remainingTime = this.lockoutDuration - (currentTime - this.lockoutTimestamp);

    return Math.ceil(remainingTime / 1000);
  }

  onSubmit() {
    // Vérifier si le compte est verrouillé
    if (this.isLockedOut()) {
      const remainingSeconds = this.getRemainingLockoutTime();
      this.errorMessage = `Trop de tentatives. Réessayez dans ${remainingSeconds} secondes.`;
      return;
    }

    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value.email, this.loginForm.value.password).subscribe({
        next: () => {
          // Réinitialiser les tentatives en cas de succès
          this.attemptCount = 0;
          this.lockoutTimestamp = null;

          const roles = this.authService.getUserRoles();

          if (roles.includes('ROLE_AGENTGP')) {
            this.router.navigate(['/accueilgp']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          // Incrémenter le compteur de tentatives
          this.attemptCount++;
          this.successMessage = null;
          this.errorMessage = err?.error?.message;
          console.log(">>>>>>>>>>>",this.errorMessage)

          // Verrouiller si le nombre max de tentatives est atteint
          if (this.attemptCount >= this.maxAttempts) {
            this.lockoutTimestamp = new Date().getTime();
            this.errorMessage = `Trop de tentatives. Réessayez dans ${this.getRemainingLockoutTime()} secondes.`;
          }
        }
      });
    } else {
      console.error('Form is invalid');
    }
  }

  protected isLockedOut(): boolean {
    if (!this.lockoutTimestamp) return false;

    const currentTime = new Date().getTime();
    const isCurrentlyLocked = (currentTime - this.lockoutTimestamp) < this.lockoutDuration;

    if (!isCurrentlyLocked) {
      // Réinitialiser le verrouillage si le temps est écoulé
      this.lockoutTimestamp = null;
      this.attemptCount = 0;
    }

    return isCurrentlyLocked;
  }
}
