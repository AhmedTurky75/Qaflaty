import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface StoreItem {
  id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-store-select',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h1 class="text-center text-3xl font-bold text-gray-900">Qaflaty</h1>
    <h2 class="mt-6 text-center text-2xl font-semibold text-gray-700">Select a Store</h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Welcome, {{ merchant()?.firstName }}! Choose a store to continue.
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-3">
      @if (loading()) {
        <div class="text-center text-gray-500">Loading stores...</div>
      }
      @for (store of stores(); track store.id) {
        <button (click)="selectStore(store)"
          class="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left">
          <div>
            <p class="font-medium text-gray-900">{{ store.name }}</p>
            <p class="text-sm text-gray-500">{{ store.slug }}</p>
          </div>
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      }
      @if (error()) {
        <div class="text-sm text-red-600 text-center">{{ error() }}</div>
      }
    </div>
  </div>
</div>
  `
})
export class StoreSelectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  merchant = this.authService.currentMerchant;
  stores = signal<StoreItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<StoreItem[]>(`${environment.apiUrl}/stores`, { withCredentials: true }).subscribe({
      next: (stores) => { this.stores.set(stores); this.loading.set(false); },
      error: () => { this.error.set('Failed to load stores'); this.loading.set(false); }
    });
  }

  selectStore(store: StoreItem): void {
    this.authService.selectStore(store.id).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: any) => this.error.set(err.message || 'Failed to select store')
    });
  }
}
