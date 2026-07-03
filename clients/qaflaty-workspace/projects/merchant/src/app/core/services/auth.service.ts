import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, share } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoreContextService } from './store-context.service';
import {
  MerchantDto,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  SelectStoreResult,
  InitiateLoginResponse,
  VerifyLoginResponse
} from 'shared';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storeContext = inject(StoreContextService);

  // Signals for reactive state
  currentMerchant = signal<MerchantDto | null>(this.loadStoredMerchant());
  isAuthenticated = signal<boolean>(!!this.loadStoredMerchant());
  storeId = signal<string | null>(localStorage.getItem('qaflaty_store_id'));
  role = signal<string | null>(localStorage.getItem('qaflaty_role'));
  permissions = signal<string[]>(JSON.parse(localStorage.getItem('qaflaty_permissions') || '[]'));

  private readonly MERCHANT_KEY = 'qaflaty_merchant';
  private refreshInProgress$: Observable<MerchantDto> | null = null;

  private loadStoredMerchant(): MerchantDto | null {
    try {
      const m = localStorage.getItem(this.MERCHANT_KEY);
      return m ? JSON.parse(m) : null;
    } catch { return null; }
  }

  /** Step 1: credentials → OTP sent, returns email */
  initiateLogin(request: LoginRequest): Observable<InitiateLoginResponse> {
    return this.http.post<InitiateLoginResponse>(`${environment.apiUrl}/auth/login`, request, { withCredentials: true });
  }

  /** Step 2: verify OTP → cookies set, returns merchant + storeIds */
  verifyOtp(email: string, otpCode: string): Observable<VerifyLoginResponse> {
    return this.http.post<VerifyLoginResponse>(
      `${environment.apiUrl}/auth/verify-otp`,
      { email, otpCode },
      { withCredentials: true }
    ).pipe(
      tap(res => this.storeMerchant(res.merchant))
    );
  }

  resendOtp(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/resend-otp`, { email }, { withCredentials: true });
  }

  register(request: RegisterRequest): Observable<MerchantDto> {
    return this.http.post<MerchantDto>(`${environment.apiUrl}/auth/register`, request, { withCredentials: true })
      .pipe(tap(merchant => this.storeMerchant(merchant)));
  }

  selectStore(storeId: string): Observable<SelectStoreResult> {
    return this.http.post<SelectStoreResult>(
      `${environment.apiUrl}/auth/select-store`,
      { storeId },
      { withCredentials: true }
    ).pipe(
      tap(result => {
        this.storeId.set(result.storeId);
        this.role.set(result.role);
        this.permissions.set(result.permissions);
        localStorage.setItem('qaflaty_store_id', result.storeId);
        localStorage.setItem('qaflaty_role', result.role);
        localStorage.setItem('qaflaty_permissions', JSON.stringify(result.permissions));
      })
    );
  }

  refreshToken(): Observable<MerchantDto> {
    if (!this.refreshInProgress$) {
      this.refreshInProgress$ = this.http.post<MerchantDto>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
        tap(merchant => this.storeMerchant(merchant)),
        catchError(err => {
          this.refreshInProgress$ = null;
          return throwError(() => err);
        }),
        share()
      );
      // Clear once the shared observable completes
      this.refreshInProgress$.subscribe({ complete: () => { this.refreshInProgress$ = null; } });
    }
    return this.refreshInProgress$;
  }

  reportAccessDenied(endpoint: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/reports/access-denied`, { endpoint }, { withCredentials: true });
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ complete: () => this.clearAuth(), error: () => this.clearAuth() });
  }

  getCurrentMerchant(): Observable<MerchantDto> {
    return this.http.get<MerchantDto>(`${environment.apiUrl}/auth/me`, { withCredentials: true })
      .pipe(tap(merchant => this.storeMerchant(merchant)));
  }

  updateProfile(request: UpdateProfileRequest): Observable<MerchantDto> {
    return this.http.patch<MerchantDto>(`${environment.apiUrl}/auth/me`, request, { withCredentials: true })
      .pipe(tap(merchant => this.storeMerchant(merchant)));
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/change-password`, request, { withCredentials: true });
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /** Returns the current merchant's ID (for SignalR hub usage) */
  getCurrentMerchantId(): string | null {
    return this.currentMerchant()?.id ?? null;
  }

  /** Returns null since auth tokens are now in httpOnly cookies, not accessible to JS */
  getAccessToken(): string | null {
    return null;
  }

  private storeMerchant(merchant: MerchantDto): void {
    localStorage.setItem(this.MERCHANT_KEY, JSON.stringify(merchant));
    this.currentMerchant.set(merchant);
    this.isAuthenticated.set(true);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.MERCHANT_KEY);
    localStorage.removeItem('qaflaty_store_id');
    localStorage.removeItem('qaflaty_role');
    localStorage.removeItem('qaflaty_permissions');
    this.currentMerchant.set(null);
    this.isAuthenticated.set(false);
    this.storeId.set(null);
    this.role.set(null);
    this.permissions.set([]);
    this.storeContext.reset();
    this.router.navigate(['/auth/login']);
  }
}
