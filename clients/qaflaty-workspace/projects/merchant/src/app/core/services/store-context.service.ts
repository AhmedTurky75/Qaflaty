import { Injectable, inject, signal, computed } from '@angular/core';
import { StoreService } from '../../features/stores/services/store.service';
import { StoreDto } from 'shared';

@Injectable({
  providedIn: 'root'
})
export class StoreContextService {
  private storeService = inject(StoreService);

  private readonly STORE_KEY = 'currentStoreId';

  stores = signal<StoreDto[]>([]);
  currentStore = signal<StoreDto | null>(null);
  loading = signal(false);
  initialized = signal(false);

  currentStoreId = computed(() => this.currentStore()?.id ?? null);

  initialize(): void {
    if (this.initialized()) return;

    this.loading.set(true);
    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        this.stores.set(stores);
        this.autoSelectStore(stores);
        this.loading.set(false);
        this.initialized.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.initialized.set(true);
      }
    });
  }

  selectStore(storeId: string): void {
    const store = this.stores().find(s => s.id === storeId);
    if (store) {
      this.currentStore.set(store);
      localStorage.setItem(this.STORE_KEY, storeId);
    }
  }

  refresh(): void {
    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        this.stores.set(stores);

        const currentId = this.currentStoreId();
        if (currentId) {
          const updated = stores.find(s => s.id === currentId);
          if (updated) {
            this.currentStore.set(updated);
          } else {
            this.autoSelectStore(stores);
          }
        } else {
          this.autoSelectStore(stores);
        }
      }
    });
  }

  private autoSelectStore(stores: StoreDto[]): void {
    if (stores.length === 0) {
      this.currentStore.set(null);
      localStorage.removeItem(this.STORE_KEY);
      return;
    }

    const savedId = localStorage.getItem(this.STORE_KEY);
    const saved = savedId ? stores.find(s => s.id === savedId) : null;

    if (saved) {
      this.currentStore.set(saved);
    } else {
      this.currentStore.set(stores[0]);
      localStorage.setItem(this.STORE_KEY, stores[0].id);
    }
  }
}
