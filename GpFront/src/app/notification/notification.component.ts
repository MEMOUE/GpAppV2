import {Component, OnDestroy, OnInit} from '@angular/core';
import {DatePipe, NgIf} from '@angular/common';
import {Subscription} from 'rxjs';
import {AuthService} from '../services/auth.service';
import {NotificationDTO} from '../model/NotificationDTO';
import {NotificationService} from '../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    NgIf,
    DatePipe
  ],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {

  selected: NotificationDTO | null = null;
  private sub: Subscription | undefined;

  constructor(private notifService: NotificationService,
              private authService: AuthService,) {}

  ngOnInit() {
    const userId =  this.authService.getUserId(); // récupère-le depuis le service d'auth
    this.notifService.loadNotifications(userId);
    this.notifService.selectedNotification$.subscribe(n => this.selected = n);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
