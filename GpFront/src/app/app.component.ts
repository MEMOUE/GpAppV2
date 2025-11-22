import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {MenuItem} from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import {AuthService} from './services/auth.service';
import {Observable} from 'rxjs';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {NotificationDTO} from './model/NotificationDTO';
import {NotificationService} from './services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MenuModule,
    TranslatePipe
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: '0', opacity: 0, overflow: 'hidden' }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  title = 'GpMonde';
  isAuthenticated$: Observable<boolean>;
  notifications: NotificationDTO[] = [];
  unreadCount: number = 0;
  mobileMenuOpen: boolean = false;
  currentLang: string = 'fr';

  // Menu items pour PrimeNG
  notificationItems: MenuItem[] = [];

  languageItems: MenuItem[] = [
    {
      label: 'Français',
      icon: 'pi pi-flag',
      command: () => this.changeLanguage('fr')
    },
    {
      label: 'English',
      icon: 'pi pi-flag',
      command: () => this.changeLanguage('en')
    }
  ];

  userMenuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    public notifService: NotificationService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;

    translate.setDefaultLang('fr');
    translate.use('fr');

    // S'abonner aux notifications
    this.notifService.notifications$.subscribe((list) => {
      this.notifications = list;
      this.unreadCount = list.filter(n => !n.lu).length;
      this.updateNotificationMenu();
    });

    // S'abonner à l'état d'authentification pour mettre à jour le menu utilisateur
    this.isAuthenticated$.subscribe(isAuth => {
      this.updateUserMenu(isAuth);
    });
  }

  ngOnInit(): void {
    // Charger les anciennes notifications depuis le backend
    const userId = this.authService.getUserId();
    this.notifService.loadNotifications(userId);

    // S'abonner aux notifications en temps réel (WebSocket)
    this.notifService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.unreadCount = notifs.filter(n => !n.lu).length;
      this.updateNotificationMenu();
    });
  }

  updateNotificationMenu(): void {
    if (this.notifications.length === 0) {
      this.notificationItems = [
        {
          label: 'Aucune notification',
          icon: 'pi pi-inbox',
          disabled: true,
          styleClass: 'text-gray-400'
        }
      ];
    } else {
      this.notificationItems = this.notifications.slice(0, 5).map(notif => ({
        label: notif.message,
        icon: notif.lu ? 'pi pi-check' : 'pi pi-circle-fill',
        command: () => this.openNotification(notif),
        styleClass: notif.lu ? '' : 'font-semibold bg-blue-50'
      }));

      // Ajouter "Voir tout" si plus de 5 notifications
      if (this.notifications.length > 5) {
        this.notificationItems.push({
          separator: true
        });
        this.notificationItems.push({
          label: `Voir toutes les notifications (${this.notifications.length})`,
          icon: 'pi pi-arrow-right',
          command: () => this.router.navigate(['/notifications']),
          styleClass: 'text-blue-600 font-medium'
        });
      }
    }
  }

  updateUserMenu(isAuthenticated: boolean): void {
    if (!isAuthenticated) {
      this.userMenuItems = [
        {
          label: this.translate.instant('login'),
          icon: 'pi pi-sign-in',
          command: () => this.router.navigate(['/login'])
        },
        {
          label: this.translate.instant('register'),
          icon: 'pi pi-user-plus',
          command: () => this.router.navigate(['/register'])
        }
      ];
    } else {
      this.userMenuItems = [
        {
          label: this.translate.instant('profile'),
          icon: 'pi pi-user',
          command: () => this.router.navigate(['/profile'])  // ← Navigation vers le profil
        },
        {
          separator: true
        },
        {
          label: this.translate.instant('logout'),
          icon: 'pi pi-sign-out',
          command: () => this.logout(),
          styleClass: 'text-red-600'
        }
      ];
    }
  }

  changeLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    // Mettre à jour les menus après changement de langue
    this.isAuthenticated$.subscribe(isAuth => {
      this.updateUserMenu(isAuth);
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ROLE_AGENTGP');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Échec de la déconnexion :', err);
      }
    });
  }

  openNotification(notif: NotificationDTO): void {
    this.notifService.selectNotification(notif);
    this.router.navigate(['/notification']);
  }

  publishAnnouncement(): void {
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      // Rediriger vers la page de connexion
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/addgp' }
      });
      return;
    }

    // Si connecté, naviguer vers la page de publication d'annonce
    this.router.navigate(['/addgp']);
  }

  publishNeed(): void {
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      // Rediriger vers la page de connexion
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/besoingp' }
      });
      return;
    }

    // Si connecté, naviguer vers la page de publication de besoin
    this.router.navigate(['/besoingp']);
  }
}
