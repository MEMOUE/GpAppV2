// GpFront/src/app/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProfileService, UserProfile } from '../services/profile.service';
import { TranslateService, TranslatePipe, TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import {environment} from '../../environments/environment';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    CheckboxModule,
    ToastModule,
    AvatarModule,
    DividerModule,
    ChipModule
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  userProfile: UserProfile | null = null;
  isAgentGP = false;
  loading = false;
  editMode = false;
  changePasswordMode = false;
  roles: string[] = [];

  // Gestion des fichiers
  selectedFiles: { [key: string]: File } = {};
  fileErrors: { [key: string]: string } = {};
  previewUrls: { [key: string]: string } = {};

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private translate: TranslateService,
    private router: Router,
    private messageService: MessageService,
  private authService: AuthService

  ) {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      nomagence: [''],
      adresse: [''],
      telephone: [''],
      destinations: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.roles = this.authService.getUserRoles(); // Exemple
    this.isAgentGP = this.roles.includes('ROLE_AGENTGP');
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  loadUserProfile(): void {
    this.loading = true;
    this.profileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        const roles = this.authService.getUserRoles();
        if (roles.includes('ROLE_AGENTGP')) {
          this.isAgentGP = true;

        }

        // Remplir le formulaire avec les données du profil
        this.profileForm.patchValue({
          username: profile.username,
          email: profile.email,
          nomagence: profile.nomagence || '',
          adresse: profile.adresse || '',
          telephone: profile.telephone || '',
          destinations: profile.destinations?.join(', ') || ''
        });

        // Charger les URLs des images si agent GP
        if (this.isAgentGP) {
          if (profile.logourl) {
            this.previewUrls['logo'] = `${environment.apiUrl.replace('/api/', '')}${profile.logourl}`;
          }
          if (profile.carteidentiteurl) {
            this.previewUrls['carteIdentite'] = `${environment.apiUrl.replace('/api/', '')}${profile.carteidentiteurl}`;
          }
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.errorMessage = 'Impossible de charger le profil';
        this.loading = false;
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      // Annuler les modifications
      this.loadUserProfile();
      this.selectedFiles = {};
      this.fileErrors = {};
    }
  }

  togglePasswordMode(): void {
    this.changePasswordMode = !this.changePasswordMode;
    if (!this.changePasswordMode) {
      this.passwordForm.reset();
    }
  }

  onFileSelected(fileType: string, event: any): void {
    const file = event.target.files[0];

    if (file) {
      const validationError = this.validateFile(file);

      if (validationError) {
        this.fileErrors[fileType] = validationError;
        delete this.selectedFiles[fileType];
      } else {
        this.selectedFiles[fileType] = file;
        delete this.fileErrors[fileType];

        // Créer une prévisualisation
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls[fileType] = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeFile(fileType: string): void {
    delete this.selectedFiles[fileType];
    delete this.fileErrors[fileType];

    // Restaurer l'image originale
    if (this.userProfile) {
      if (fileType === 'logo' && this.userProfile.logourl) {
        this.previewUrls['logo'] = `${environment.apiUrl.replace('/api/', '')}${this.userProfile.logourl}`;
      } else if (fileType === 'carteIdentite' && this.userProfile.carteidentiteurl) {
        this.previewUrls['carteIdentite'] = `${environment.apiUrl.replace('/api/', '')}${this.userProfile.carteidentiteurl}`;
      }
    }

    const fileInput = document.getElementById(fileType) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  validateFile(file: File): string | null {
    if (file.size > 5 * 1024 * 1024) {
      return 'Le fichier ne peut pas dépasser 5MB';
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Seuls les fichiers JPG, PNG et GIF sont acceptés';
    }

    return null;
  }

  onSubmitProfile(): void {
    if (!this.profileForm.valid || !this.userProfile) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.loading = true;
    const formData = { ...this.profileForm.value };

    // Traiter les destinations
    if (formData.destinations) {
      formData.destinations = formData.destinations
        .split(',')
        .map((d: string) => d.trim())
        .filter((d: string) => d);
    }

    // Supprimer le username (non modifiable)
    delete formData.username;

    const updateObservable = this.isAgentGP
      ? this.profileService.updateAgentProfile(this.userProfile.id, formData)
      : this.profileService.updateUserProfile(this.userProfile.id, formData);

    updateObservable.subscribe({
      next: (updatedProfile) => {
        // Upload des fichiers si agent GP
        if (this.isAgentGP) {
          this.uploadFiles(updatedProfile.id);
        } else {
          this.handleUpdateSuccess();
        }
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.error || 'Impossible de mettre à jour le profil'
        });
        this.loading = false;
      }
    });
  }

  uploadFiles(agentId: number): void {
    const uploads: Promise<any>[] = [];

    if (this.selectedFiles['logo']) {
      uploads.push(
        this.profileService.uploadLogo(agentId, this.selectedFiles['logo']).toPromise()
      );
    }

    if (this.selectedFiles['carteIdentite']) {
      uploads.push(
        this.profileService.uploadCarteIdentite(agentId, this.selectedFiles['carteIdentite']).toPromise()
      );
    }

    if (uploads.length > 0) {
      Promise.all(uploads)
        .then(() => {
          this.handleUpdateSuccess();
        })
        .catch((err) => {
          console.error('Erreur lors de l\'upload des fichiers:', err);
          this.messageService.add({
            severity: 'warn',
            summary: 'Attention',
            detail: 'Profil mis à jour mais erreur lors de l\'upload des fichiers'
          });
          this.loading = false;
        });
    } else {
      this.handleUpdateSuccess();
    }
  }

  handleUpdateSuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Profil mis à jour avec succès'
    });
    this.editMode = false;
    this.selectedFiles = {};
    this.loadUserProfile();
  }

  onSubmitPassword(): void {
    if (!this.passwordForm.valid || !this.userProfile) {
      this.markPasswordFieldsAsTouched();
      return;
    }

    this.loading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.profileService.changePassword(this.userProfile.id, currentPassword, newPassword).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Mot de passe modifié avec succès'
        });
        this.changePasswordMode = false;
        this.passwordForm.reset();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du changement de mot de passe:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.error || 'Impossible de changer le mot de passe'
        });
        this.loading = false;
      }
    });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  private markPasswordFieldsAsTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      this.passwordForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(field: string, form: FormGroup = this.profileForm): string {
    const control = form.get(field);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    if (control?.hasError('email')) {
      return 'Email invalide';
    }
    if (control?.hasError('mismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }

  getRoleLabel(role: any): string {
    if (role.name === 'ROLE_AGENTGP') return 'Agent GP';
    if (role.name === 'ROLE_USER') return 'Utilisateur';
    return role.name;
  }

  getInitials(): string {
    if (!this.userProfile?.username) return 'U';
    return this.userProfile.username.substring(0, 2).toUpperCase();
  }
}
