import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface StoreItem {
  id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-store-select',
  standalone: true,
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './store-select.component.html',
  styleUrl: './store-select.component.scss',
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
