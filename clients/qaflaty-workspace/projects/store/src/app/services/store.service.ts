import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Store } from '../models/store.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private http = inject(HttpClient);
  private storeSubject = new BehaviorSubject<Store | null>(null);

  store$ = this.storeSubject.asObservable();
  currentStore = signal<Store | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  isStoreActive = computed(() => {
    const store = this.currentStore();
    return store?.status === 'Active';
  });

  /**
   * Detect store from subdomain or custom domain
   * In production: extract from window.location.hostname
   * In development: use X-Store-Slug header
   */
  detectAndLoadStore(): Observable<Store> {
    this.isLoading.set(true);
    this.error.set(null);

    // In development, we'll use a header. In production, extract from hostname
    const hostname = window.location.hostname;
    const headers = this.getStoreHeaders(hostname);

    return this.http.get<Store>(`${environment.apiUrl}/storefront/store`, { headers }).pipe(
      tap(store => {
        this.currentStore.set(store);
        this.storeSubject.next(store);
        this.isLoading.set(false);
      })
    );
  }

  /**
   * Load store by slug (for development/testing)
   */
  loadStoreBySlug(slug: string): Observable<Store> {
    this.isLoading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders().set('X-Store-Slug', slug);

    return this.http.get<Store>(`${environment.apiUrl}/storefront/store`, { headers }).pipe(
      tap(store => {
        this.currentStore.set(store);
        this.storeSubject.next(store);
        this.isLoading.set(false);
      })
    );
  }

  private getStoreHeaders(hostname: string): HttpHeaders {
    // Check if it's a custom domain or subdomain
    if (hostname.includes('qaflaty.com')) {
      // Extract subdomain (e.g., "mystore.qaflaty.com" -> "mystore")
      const subdomain = hostname.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'qaflaty') {
        return new HttpHeaders().set('X-Store-Slug', subdomain);
      }
    }

    // For custom domains or localhost, check for configured slug
    const slug = this.getConfiguredSlug();
    if (slug) {
      return new HttpHeaders().set('X-Store-Slug', slug);
    }

    // Fallback: use hostname as custom domain
    return new HttpHeaders().set('X-Custom-Domain', hostname);
  }

  private getConfiguredSlug(): string | null {
    // In development, check localStorage or environment
    if (!environment.production) {
      return localStorage.getItem('dev-store-slug') || 'demo-store';
    }
    return null;
  }

  setDevStoreSlug(slug: string): void {
    localStorage.setItem('dev-store-slug', slug);
  }
}
