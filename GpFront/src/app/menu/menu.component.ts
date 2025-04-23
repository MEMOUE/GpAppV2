import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {
  isMenuOpen = true;    // Contrôle l'état ouvert/réduit (pour le contenu du menu)
  isMenuVisible = true; // Contrôle la visibilité du menu entier

  ngOnInit(): void {
    // Récupérer l'état du menu depuis le localStorage s'il existe
    const savedMenuState = localStorage.getItem('menuState');
    if (savedMenuState) {
      const state = JSON.parse(savedMenuState);
      this.isMenuOpen = state.isMenuOpen;
      this.isMenuVisible = state.isMenuVisible;
    }
  }

  toggleMenu(): void {
    // Si le menu est invisible, le rendre visible d'abord
    if (!this.isMenuVisible) {
      this.isMenuVisible = true;
      // Attendre que l'animation de transition soit terminée avant de changer l'état d'ouverture
      setTimeout(() => {
        this.isMenuOpen = true;
        this.saveMenuState();
      }, 50);
    } else {
      // Si le menu est déjà visible, basculer entre ouvert et fermé
      if (this.isMenuOpen) {
        // Si le menu est ouvert, le réduire
        this.isMenuOpen = false;
        this.saveMenuState();
      } else {
        // Si le menu est réduit, le cacher complètement
        this.isMenuVisible = false;
        this.saveMenuState();
      }
    }
  }

  // Sauvegarder l'état du menu dans le localStorage
  private saveMenuState(): void {
    localStorage.setItem('menuState', JSON.stringify({
      isMenuOpen: this.isMenuOpen,
      isMenuVisible: this.isMenuVisible
    }));
  }
}
