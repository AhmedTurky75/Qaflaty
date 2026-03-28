import { Injectable, signal, computed, effect, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { catchError, tap, map, of, Observable } from 'rxjs';
import { GuestSessionService } from './guest-session.service';

export interface StoreCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  phone?: string;
  phoneCountryCode?: string;
  secondaryPhone?: string;
  secondaryPhoneCountryCode?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface CustomerAddress {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  latitude: number;
  longitude: number;
  countryCode: number;
  cityId?: number;
  districtId?: number;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
}

export interface LoginCustomerRequest {
  emailOrUsername: string;
  password: string;
}

export type InitiateLoginResponse =
  | { requiresOtp: true; email: string }
  | { requiresOtp: false; customer: StoreCustomer };

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly guestSession = inject(GuestSessionService);
  private readonly injector = inject(Injector);
  private readonly apiUrl = `${environment.apiUrl}/storefront/auth`;

  private readonly _customer = signal<StoreCustomer | null>(this.loadFromStorage());
  readonly customer = this._customer.asReadonly();
  readonly isAuthenticated = computed(() => this._customer() !== null);
  readonly customerName = computed(() => {
    const c = this._customer();
    return c ? c.fullName || `${c.firstName} ${c.lastName}` : 'Guest';
  });
  readonly customerEmail = computed(() => this._customer()?.email);

  private readonly saveEffect = effect(() => {
    const customer = this._customer();
    if (customer) {
      localStorage.setItem('customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('customer');
    }
  });

  private loadFromStorage(): StoreCustomer | null {
    try {
      const c = localStorage.getItem('customer');
      return c ? JSON.parse(c) : null;
    } catch { return null; }
  }

  /** Step 1: credentials → either OTP sent or direct login (when requireEmailVerification is false) */
  initiateLogin(request: LoginCustomerRequest): Observable<InitiateLoginResponse> {
    return this.http.post<any>(`${this.apiUrl}/login`, request, { withCredentials: true }).pipe(
      map(res => {
        if ('id' in res) {
          // Direct login — backend set cookies, return customer
          this._customer.set(res as StoreCustomer);
          this.syncCart();
          import('./chat.service').then(({ ChatService }) => {
            this.injector.get(ChatService).resetForCustomer();
          });
          return { requiresOtp: false, customer: res as StoreCustomer } as InitiateLoginResponse;
        }
        return { requiresOtp: true, email: res.email } as InitiateLoginResponse;
      })
    );
  }

  /** Step 2: verify OTP → cookies set, customer returned */
  verifyOtp(email: string, otpCode: string): Observable<StoreCustomer> {
    return this.http.post<StoreCustomer>(
      `${this.apiUrl}/verify-otp`,
      { email, otpCode },
      { withCredentials: true }
    ).pipe(tap(customer => {
      this._customer.set(customer);
      this.syncCart();
      import('./chat.service').then(({ ChatService }) => {
        this.injector.get(ChatService).resetForCustomer();
      });
    }));
  }

  resendOtp(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend-otp`, { email }, { withCredentials: true });
  }

  register(request: RegisterCustomerRequest): Observable<StoreCustomer> {
    return this.http.post<StoreCustomer>(`${this.apiUrl}/register`, request, { withCredentials: true }).pipe(
      tap(customer => {
        this._customer.set(customer);
        this.syncCart();
      })
    );
  }

  refreshToken(): Observable<StoreCustomer> {
    return this.http.post<StoreCustomer>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(tap(c => this._customer.set(c)));
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => this.clearAuthAndResetChat(),
        error: () => this.clearAuthAndResetChat()
      });
  }

  private clearAuthAndResetChat(): void {
    this.clearAuth();
    import('./chat.service').then(({ ChatService }) => {
      this.injector.get(ChatService).resetForGuest();
    });
  }

  getProfile(): Observable<StoreCustomer | null> {
    return this.http.get<StoreCustomer>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap(c => this._customer.set(c)),
      catchError(() => of(null))
    );
  }

  updateProfile(profile: { firstName: string; lastName: string; phone?: string; phoneCountryCode?: string; secondaryPhone?: string; secondaryPhoneCountryCode?: string }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile`, profile, { withCredentials: true }).pipe(
      tap(() => {
        const current = this._customer();
        if (current) this._customer.set({
          ...current,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: `${profile.firstName} ${profile.lastName}`,
          phone: profile.phone,
          phoneCountryCode: profile.phoneCountryCode,
          secondaryPhone: profile.secondaryPhone,
          secondaryPhoneCountryCode: profile.secondaryPhoneCountryCode
        });
      })
    );
  }

  getAddresses(): Observable<CustomerAddress[]> {
    return this.http.get<CustomerAddress[]>(`${environment.apiUrl}/storefront/addresses`, { withCredentials: true });
  }

  addAddress(address: CustomerAddress): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/storefront/addresses`, address, { withCredentials: true });
  }

  editAddress(originalLabel: string, address: CustomerAddress): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/storefront/addresses/${encodeURIComponent(originalLabel)}`,
      address,
      { withCredentials: true }
    );
  }

  removeAddress(label: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/storefront/addresses/${encodeURIComponent(label)}`,
      { withCredentials: true }
    );
  }

  /** Returns null since auth tokens are now in httpOnly cookies, not accessible to JS */
  getAccessToken(): string | null {
    return null;
  }

  resolveDeliveryFee(countryCode: number, cityId?: number, districtId?: number): Observable<{ isDeliveryAvailable: boolean; fee: number | null; currency: string | null; resolvedAtLevel: string }> {
    const params: Record<string, string> = { countryCode: String(countryCode) };
    if (cityId) params['cityId'] = String(cityId);
    if (districtId) params['districtId'] = String(districtId);
    return this.http.get<any>(`${environment.apiUrl}/storefront/addresses/delivery-fee`, { params });
  }

  private clearAuth(): void {
    localStorage.removeItem('customer');
    this._customer.set(null);
    this.router.navigate(['/']);
  }

  private syncCart(): void {
    const guestSessionId = this.guestSession.getGuestId();
    if (!guestSessionId) return;

    // Guest cart is persisted on the backend — send the session ID so the server
    // merges it into the authenticated cart. No localStorage items to include.
    const syncRequest = { guestItems: [], guestSessionId };
    this.http.post(`${environment.apiUrl}/storefront/cart/sync`, syncRequest, { withCredentials: true }).subscribe();
    this.guestSession.clearGuestId();
  }
}
