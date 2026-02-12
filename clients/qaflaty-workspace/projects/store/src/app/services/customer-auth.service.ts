import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { catchError, tap, of } from 'rxjs';

export interface StoreCustomer {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
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
  phoneNumber: string;
  isDefault: boolean;
}

export interface CustomerAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  customer: StoreCustomer;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginCustomerRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/storefront/auth`;

  // State signals
  private readonly _customer = signal<StoreCustomer | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);

  // Public readonly signals
  readonly customer = this._customer.asReadonly();
  readonly isAuthenticated = computed(() => this._customer() !== null);
  readonly customerName = computed(() => this._customer()?.fullName ?? 'Guest');
  readonly customerEmail = computed(() => this._customer()?.email);

  // Auto-save to localStorage
  private readonly saveEffect = effect(() => {
    const customer = this._customer();
    const accessToken = this._accessToken();
    const refreshToken = this._refreshToken();

    if (customer && accessToken && refreshToken) {
      localStorage.setItem('customer', JSON.stringify(customer));
      localStorage.setItem('customer_access_token', accessToken);
      localStorage.setItem('customer_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('customer');
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer_refresh_token');
    }
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const customer = localStorage.getItem('customer');
    const accessToken = localStorage.getItem('customer_access_token');
    const refreshToken = localStorage.getItem('customer_refresh_token');

    if (customer && accessToken && refreshToken) {
      this._customer.set(JSON.parse(customer));
      this._accessToken.set(accessToken);
      this._refreshToken.set(refreshToken);
    }
  }

  register(request: RegisterCustomerRequest) {
    return this.http.post<CustomerAuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Registration failed', error);
        throw error;
      })
    );
  }

  login(request: LoginCustomerRequest) {
    return this.http.post<CustomerAuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Login failed', error);
        throw error;
      })
    );
  }

  logout(): void {
    this._customer.set(null);
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this.router.navigate(['/']);
  }

  getProfile() {
    return this.http.get<StoreCustomer>(`${this.apiUrl}/me`).pipe(
      tap(customer => this._customer.set(customer)),
      catchError(error => {
        console.error('Failed to fetch profile', error);
        return of(null);
      })
    );
  }

  updateProfile(profile: { fullName: string; email: string; phone?: string }) {
    return this.http.put(`${this.apiUrl}/profile`, profile).pipe(
      tap(() => {
        const current = this._customer();
        if (current) {
          this._customer.set({ ...current, ...profile });
        }
      })
    );
  }

  addAddress(address: Omit<CustomerAddress, 'isDefault'> & { isDefault?: boolean }) {
    return this.http.post(`${this.apiUrl}/addresses`, address).pipe(
      tap(() => {
        // Refresh customer profile to get updated addresses
        this.getProfile().subscribe();
      })
    );
  }

  updateAddress(label: string, address: Omit<CustomerAddress, 'isDefault'> & { isDefault?: boolean }) {
    return this.http.put(`${this.apiUrl}/addresses/${encodeURIComponent(label)}`, address).pipe(
      tap(() => {
        // Refresh customer profile to get updated addresses
        this.getProfile().subscribe();
      })
    );
  }

  removeAddress(label: string) {
    return this.http.delete(`${this.apiUrl}/addresses/${encodeURIComponent(label)}`).pipe(
      tap(() => {
        // Refresh customer profile to get updated addresses
        this.getProfile().subscribe();
      })
    );
  }

  setDefaultAddress(label: string) {
    return this.http.put(`${this.apiUrl}/addresses/${encodeURIComponent(label)}/set-default`, {}).pipe(
      tap(() => {
        // Refresh customer profile to get updated addresses
        this.getProfile().subscribe();
      })
    );
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  private async handleAuthSuccess(response: CustomerAuthResponse): Promise<void> {
    this._customer.set(response.customer);
    this._accessToken.set(response.accessToken);
    this._refreshToken.set(response.refreshToken);

    // Sync cart after login
    await this.syncCart();
  }

  private async syncCart(): Promise<void> {
    // Get guest cart from localStorage
    const guestCartJson = localStorage.getItem('cart');
    if (!guestCartJson) return;

    try {
      const guestCart = JSON.parse(guestCartJson);
      if (!guestCart.items || guestCart.items.length === 0) return;

      // Call cart sync endpoint
      const syncRequest = {
        guestItems: guestCart.items.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity
        }))
      };

      await this.http.post(`${environment.apiUrl}/storefront/cart/sync`, syncRequest).toPromise();

      // Clear guest cart from localStorage
      localStorage.removeItem('cart');

      console.log('Cart synced successfully');
    } catch (error) {
      console.error('Failed to sync cart', error);
    }
  }
}
