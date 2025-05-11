import { Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {NotificationDTO} from '../model/NotificationDTO';


@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private stompClient: Client;

  private _notifications = new BehaviorSubject<NotificationDTO[]>([]);
  private _selectedNotification = new BehaviorSubject<NotificationDTO | null>(null);

  public notifications$ = this._notifications.asObservable();
  public selectedNotification$ = this._selectedNotification.asObservable();

  constructor(private http: HttpClient) {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://147.79.101.109:8080/ws'),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    this.stompClient.onConnect = () => {
      this.stompClient.subscribe('/user/queue/notifications', (message: IMessage) => {
        const notif: NotificationDTO = { ...JSON.parse(message.body), lu: false };
        const current = this._notifications.getValue();
        this._notifications.next([notif, ...current]);
      });
    };

    this.stompClient.activate();
  }

  selectNotification(notification: NotificationDTO) {
    const updated = this._notifications.getValue().map(n =>
      n === notification ? { ...n, lu: true } : n
    );
    this._notifications.next(updated);
    this._selectedNotification.next({ ...notification, lu: true });
  }



  getUnreadCount(): number {
    return this._notifications.getValue().filter(n => !n.lu).length;
  }

  disconnect() {
    if (this.stompClient.active) {
      this.stompClient.deactivate();
    }
  }

  loadNotifications(userId: number | null) {
    return this.http.get<NotificationDTO[]>(`http://147.79.101.109:8080/api/notifications/user/${userId}`)
      .subscribe(data => {
        this._notifications.next(data.reverse()); // ou data selon l'ordre souhaité
      });
  }
}
