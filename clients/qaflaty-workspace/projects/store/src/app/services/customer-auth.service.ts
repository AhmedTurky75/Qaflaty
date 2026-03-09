import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { catchError, tap, of, Observable } from 'rxjs';
import { GuestSessionService } from './guest-session.service';

export interface StoreCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  phone?: string;
  secondaryPhone?: string;
  isVerified: boolean;
  createdAt: string;
  addresses: CustomerAddress[];
}

export interface CustomerAddress {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
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

export interface InitiateLoginResponse {
  email: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly guestSession = inject(GuestSessionService);
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

  /** Step 1: credentials → OTP sent */
  initiateLogin(request: LoginCustomerRequest): Observable<InitiateLoginResponse> {
    return this.http.post<InitiateLoginResponse>(`${this.apiUrl}/login`, request, { withCredentials: true });
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
      .subscribe({ complete: () => this.clearAuth(), error: () => this.clearAuth() });
  }

  getProfile(): Observable<StoreCustomer | null> {
    return this.http.get<StoreCustomer>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap(c => this._customer.set(c)),
      catchError(() => of(null))
    );
  }

  updateProfile(profile: { fullName?: string; phone?: string; secondaryPhone?: string }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile`, profile, { withCredentials: true }).pipe(
      tap(() => {
        const current = this._customer();
        if (current) this._customer.set({ ...current, ...profile });
      })
    );
  }

  addAddress(address: Omit<CustomerAddress, 'isDefault'> & { isDefault?: boolean }): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/storefront/addresses`, address, { withCredentials: true }).pipe(
      tap(() => this.getProfile().subscribe())
    );
  }

  removeAddress(label: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/storefront/addresses/${encodeURIComponent(label)}`,
      { withCredentials: true }
    ).pipe(tap(() => this.getProfile().subscribe()));
  }

  getLocations(): { countries: () => Observable<any[]>; cities: (id: number) => Observable<any[]> } {
    return {
      countries: () => this.http.get<any[]>(`${environment.apiUrl}/storefront/locations/countries`),
      cities: (countryId: number) => this.http.get<any[]>(`${environment.apiUrl}/storefront/locations/cities?countryId=${countryId}`)
    };
  }

  private clearAuth(): void {
    localStorage.removeItem('customer');
    this._customer.set(null);
    this.router.navigate(['/']);
  }

  private syncCart(): void {
    const guestCartJson = localStorage.getItem('qaflaty_cart');
    const guestSessionId = this.guestSession.getGuestId();
    if (!guestCartJson && !guestSessionId) return;

    try {
      const guestItems: any[] = guestCartJson ? JSON.parse(guestCartJson) : [];
      const syncRequest = {
        guestItems: guestItems.map((item: any) => ({
          productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity
        })),
        guestSessionId
      };
      this.http.post(`${environment.apiUrl}/storefront/cart/sync`, syncRequest, { withCredentials: true }).subscribe();
      localStorage.removeItem('qaflaty_cart');
      this.guestSession.clearGuestId();
    } catch (e) { console.error('Failed to sync cart', e); }
  }
}
