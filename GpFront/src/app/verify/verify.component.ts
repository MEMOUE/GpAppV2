import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService} from '../services/auth.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  standalone: true,
  styleUrls: ['./verify.component.scss']
})
export class VerifyComponent implements OnInit {
  verificationMessage: string = "Vérification en cours...";

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token']; // Récupérer le token de l'URL

      if (token) {
        this.verifyToken(token);
      } else {
        this.verificationMessage = "Token invalide.";
      }
    });

    // Observer le statut de la vérification pour afficher le message approprié
    this.authService.verificationStatus.subscribe(status => {
      this.verificationMessage = status;
    });
  }

  verifyToken(token: string): void {
    this.authService.verifyToken(token).subscribe({
      next: (response: any) => {
        this.authService.setVerificationStatus(response);  // Le message du backend
        setTimeout(() => this.router.navigate(['/login']), 10000); // Redirige vers la page de connexion après 3s
      },
      error: () => {
        this.authService.setVerificationStatus("Échec de la vérification du compte.");
      }
    });
  }
}
