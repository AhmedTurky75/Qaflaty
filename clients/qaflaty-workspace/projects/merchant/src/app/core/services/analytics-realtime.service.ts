import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ProductViewerCount {
  productId: string;
  viewerCount: number;
}

export interface LiveMetrics {
  activeUsers: number;
  activeCartCount: number;
  productViewers: ProductViewerCount[];
}

interface PresenceUpdatedPayload {
  storeId: string;
  activeUsers: number;
  productViewers: ProductViewerCount[];
}

interface ActiveCartsChangedPayload {
  storeId: string;
}

/**
 * Live merchant-dashboard analytics client. Loads a one-time HTTP snapshot on connect, then
 * streams deltas over the AnalyticsHub SignalR connection — mirrors the pattern established by
 * MerchantChatService (signals-based state, token via ?access_token= query param, automatic
 * reconnect).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsRealtimeService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private hubConnection?: signalR.HubConnection;
  private currentStoreId?: string;

  activeUsers = signal(0);
  activeCartCount = signal(0);
  productViewers = signal<ProductViewerCount[]>([]);
  isConnected = signal(false);

  /** Bumped whenever the server reports the active-cart list changed — active-carts.component watches this to re-fetch. */
  cartsChangedTick = signal(0);

  /** Connects to (or switches) the store being watched. Safe to call repeatedly, e.g. on every store-context change. */
  async connectToStore(storeId: string): Promise<void> {
    if (this.currentStoreId === storeId && this.isConnected()) return;

    if (this.currentStoreId && this.currentStoreId !== storeId) {
      await this.unsubscribeCurrent();
    }

    this.currentStoreId = storeId;
    await this.loadSnapshot(storeId);

    if (!this.hubConnection) {
      await this.startConnection();
    }

    if (this.isConnected()) {
      await this.subscribeCurrent();
    }
  }

  disconnect(): void {
    this.hubConnection?.stop();
    this.hubConnection = undefined;
    this.isConnected.set(false);
    this.currentStoreId = undefined;
  }

  private async loadSnapshot(storeId: string): Promise<void> {
    try {
      const params = new HttpParams().set('storeId', storeId);
      const metrics = await firstValueFrom(
        this.http.get<LiveMetrics>(`${environment.apiUrl}/analytics/live`, { params })
      );
      this.activeUsers.set(metrics.activeUsers);
      this.activeCartCount.set(metrics.activeCartCount);
      this.productViewers.set(metrics.productViewers);
    } catch (err) {
      // Live metrics are a progressive enhancement — a failed snapshot shouldn't break the dashboard.
      console.error('Failed to load live metrics snapshot:', err);
    }
  }

  private async startConnection(): Promise<void> {
    const token = this.authService.getAccessToken();
    const hubUrl = `${environment.apiUrl.replace('/api', '')}/hubs/analytics${token ? `?access_token=${token}` : ''}`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('PresenceUpdated', (payload: PresenceUpdatedPayload) => {
      if (payload.storeId !== this.currentStoreId) return;
      this.activeUsers.set(payload.activeUsers);
      this.productViewers.set(payload.productViewers);
    });

    this.hubConnection.on('ActiveCartsChanged', (payload: ActiveCartsChangedPayload) => {
      if (payload.storeId !== this.currentStoreId) return;
      this.cartsChangedTick.update(n => n + 1);
      this.loadSnapshot(payload.storeId);
    });

    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
      this.subscribeCurrent();
    });

    this.hubConnection.onclose(() => this.isConnected.set(false));

    try {
      await this.hubConnection.start();
      this.isConnected.set(true);
    } catch (err) {
      console.error('Analytics SignalR connection failed:', err);
      this.isConnected.set(false);
      // Don't throw — the HTTP snapshot already loaded; the dashboard just won't get live updates.
    }
  }

  private async subscribeCurrent(): Promise<void> {
    if (!this.hubConnection || !this.currentStoreId) return;
    try {
      await this.hubConnection.invoke('Subscribe', this.currentStoreId);
    } catch (err) {
      console.error('Failed to subscribe to analytics for store:', err);
    }
  }

  private async unsubscribeCurrent(): Promise<void> {
    if (!this.hubConnection || !this.currentStoreId || !this.isConnected()) return;
    try {
      await this.hubConnection.invoke('Unsubscribe', this.currentStoreId);
    } catch {
      // Connection may already be gone — nothing to clean up.
    }
  }
}
