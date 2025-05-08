import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiURL: string = `${environment.apiUrl}auth/`;
  private loginURL: string = `${this.apiURL}login`;
  private logoutURL: string = `${this.apiURL}logout`;
  private verificationStatusSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private router: Router, private http: HttpClient) {}


  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // 🔹 Connexion et stockage du token
  login(email: string, password: string): Observable<{ token: string,  iduser: number, username: string, roles: any[], email: string }> {
    return this.http.post<{ token: string,  iduser: number, username: string, roles: any[], email: string }>(this.loginURL, { email, password }).pipe(
      tap({
        next: (response) => {
          this.saveToken(response.token);
          this.saveUserInfo(response.iduser, response.username, response.roles);
          this.isAuthenticatedSubject.next(true);
        },
        error: (err) => {
          console.error('Échec de la connexion :', err);
        }
      })
    );
  }

  // 🔹 Stocker le token
  private saveToken(token: string): void {
    sessionStorage.setItem('authToken', token);
  }

  // 🔹 Récupérer le token
  getToken(): string | null {
    return sessionStorage.getItem('authToken');
  }

  // 🔹 Supprimer le token
  private clearToken(): void {
    sessionStorage.removeItem('authToken');
  }

  // 🔹 Stocker les infos utilisateur
  private saveUserInfo(iduser: number, username: string, roles: any[]): void {
    sessionStorage.setItem('iduser', iduser.toString());
    sessionStorage.setItem('loggedUser', username);
    const roleNames = roles.map(role => role.name);
    sessionStorage.setItem('roles', JSON.stringify(roleNames));
  }

  getUserRoles(): string[] {
    const roles = sessionStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  // 🔹 Récupérer l'utilisateur connecté
  getLoggedUser(): string {
    return sessionStorage.getItem('loggedUser') || '';
  }

  // 🔹 Vérifier si un token existe
  private hasToken(): boolean {
    return !!sessionStorage.getItem('authToken');
  }

  // 🔹 Récupérer l'ID de l'utilisateur connecté
  getUserId(): number | null {
    const id = sessionStorage.getItem('iduser');
    return id ? parseInt(id, 10) : null;
  }


  // 🔹 Déconnexion
  logout(): Observable<any> {
    return this.http.post<any>(this.logoutURL, {}).pipe(
      tap({
        next: () => {
          this.clearToken();
          sessionStorage.removeItem('iduser');
          sessionStorage.removeItem('loggedUser');
          this.isAuthenticatedSubject.next(false);
          sessionStorage.removeItem('roles');
          console.log('Déconnexion réussie');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Échec de la déconnexion :', err);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiURL}forgot-password`, { email },
    { headers: { 'Content-Type': 'application/json' } }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiURL}reset-password`, { token, newPassword },
      { headers: { 'Content-Type': 'application/json' } }
      );
  }

  // verification email à l'inscription
  get verificationStatus(): Observable<string> {
    return this.verificationStatusSubject.asObservable();
  }

  verifyToken(token: string): Observable<any> {
    return this.http.get(`${this.apiURL}verify?token=${token}`, { responseType: 'text' });
  }

  setVerificationStatus(status: string): void {
    this.verificationStatusSubject.next(status);
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('iduser');
  }

}
