import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../stores/services/store.service';
import { StoreListDto } from 'shared';

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './store-settings.component.html'
})
export class StoreSettingsComponent implements OnInit {
  private storeService = inject(StoreService);
  private router = inject(Router);

  stores = signal<StoreListDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStores();
  }

  private loadStores(): void {
    this.loading.set(true);
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores.set(stores);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load stores');
        this.loading.set(false);
      }
    });
  }

  navigateToStoreDetails(storeId: string): void {
    this.router.navigate(['/stores', storeId]);
  }

  createNewStore(): void {
    this.router.navigate(['/stores/create']);
  }
}
