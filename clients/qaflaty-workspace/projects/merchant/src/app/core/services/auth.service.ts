import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  MerchantDto
} from 'shared';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentMerchantSubject = new BehaviorSubject<MerchantDto | null>(null);
  public currentMerchant$ = this.currentMerchantSubject.asObservable();

  isAuthenticated = signal<boolean>(false);

  private readonly TOKEN_KEY = 'qaflaty_access_token';
  private readonly REFRESH_TOKEN_KEY = 'qaflaty_refresh_token';
  private readonly MERCHANT_KEY = 'qaflaty_merchant';

  constructor() {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = this.getAccessToken();
    const merchant = this.getStoredMerchant();

    if (token && merchant) {
      this.isAuthenticated.set(true);
      this.currentMerchantSubject.next(merchant);
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => this.handleError(error))
      );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => this.handleError(error))
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/change-password`, request);
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken })
        .subscribe({
          complete: () => this.clearAuth()
        });
    } else {
      this.clearAuth();
    }
  }

  getCurrentMerchant(): Observable<MerchantDto> {
    return this.http.get<MerchantDto>(`${environment.apiUrl}/auth/me`)
      .pipe(
        tap(merchant => {
          this.currentMerchantSubject.next(merchant);
          this.storeMerchant(merchant);
        })
      );
  }

  updateProfile(request: UpdateProfileRequest): Observable<MerchantDto> {
    return this.http.put<MerchantDto>(`${environment.apiUrl}/auth/profile`, request)
      .pipe(
        tap(merchant => {
          this.currentMerchantSubject.next(merchant);
          this.storeMerchant(merchant);
        })
      );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.storeTokens(response.accessToken, response.refreshToken);
    this.storeMerchant(response.merchant);
    this.currentMerchantSubject.next(response.merchant);
    this.isAuthenticated.set(true);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.MERCHANT_KEY);
    this.currentMerchantSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private storeMerchant(merchant: MerchantDto): void {
    localStorage.setItem(this.MERCHANT_KEY, JSON.stringify(merchant));
  }

  private getStoredMerchant(): MerchantDto | null {
    const merchantJson = localStorage.getItem(this.MERCHANT_KEY);
    return merchantJson ? JSON.parse(merchantJson) : null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth error:', error);
    return throwError(() => error);
  }
}
