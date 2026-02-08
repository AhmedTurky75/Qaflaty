import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StoreService } from '../services/store.service';
import { StoreCardComponent } from '../components/store-card/store-card.component';
import { StoreDto } from 'shared';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, StoreCardComponent],
  templateUrl: './store-list.component.html',
  styleUrls: ['./store-list.component.scss']
})
export class StoreListComponent implements OnInit {
  private storeService = inject(StoreService);
  private router = inject(Router);

  stores = signal<StoreDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        this.stores.set(stores);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load stores');
        this.loading.set(false);
      }
    });
  }

  onDeleteStore(storeId: string): void {
    this.storeService.deleteStore(storeId).subscribe({
      next: () => {
        this.stores.update(stores => stores.filter(s => s.id !== storeId));
      },
      error: (err) => {
        alert(`Failed to delete store: ${err.message}`);
      }
    });
  }

  navigateToCreateStore(): void {
    this.router.navigate(['/stores/create']);
  }
}
