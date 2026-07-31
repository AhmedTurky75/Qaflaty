import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type AdProvider = 'Meta' | 'TikTok' | 'Snapchat' | 'GoogleAnalytics4' | 'GoogleAds' | 'GoogleTagManager';

export interface ProviderIntegrationDto {
  id: string;
  provider: AdProvider;
  status: 'NotConfigured' | 'Connected' | 'Verified' | 'Error' | 'Disconnected';
  browserTrackingEnabled: boolean;
  serverTrackingEnabled: boolean;
  healthScore: number;
  lastEventAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  lastVerifiedAt?: string | null;
  maskedCredentials: Record<string, string>;
}

export interface ConnectProviderRequest {
  credentials: Record<string, string>;
  browserTrackingEnabled: boolean;
  serverTrackingEnabled: boolean;
}

export interface AdsDashboardStatsDto {
  eventsToday: number;
  purchaseEventsToday: number;
  failedEventsToday: number;
  pendingRetries: number;
  averageDeliveryTimeMs: number;
}

export interface AdsProviderCardDto {
  id: string;
  provider: AdProvider;
  status: string;
  browserTrackingEnabled: boolean;
  serverTrackingEnabled: boolean;
  healthScore: number;
  lastEventAt?: string | null;
  eventsToday: number;
  lastErrorMessage?: string | null;
}

export interface AdsDashboardDto {
  stats: AdsDashboardStatsDto;
  providers: AdsProviderCardDto[];
}

export interface TrackingLogRowDto {
  trackingEventId: string;
  dispatchLogId: string;
  date: string;
  provider: string;
  eventType: string;
  orderId?: string | null;
  channel: string;
  status: string;
  attemptCount: number;
  durationMs?: number | null;
  responseStatus?: number | null;
  responseBody?: string | null;
  errorMessage?: string | null;
  correlationId: string;
}

export interface PagedTrackingLogsDto {
  items: TrackingLogRowDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface TimelineDispatchDto {
  provider: string;
  status: string;
  responseStatus?: number | null;
  errorMessage?: string | null;
}

export interface TimelineEntryDto {
  timestamp: string;
  eventType: string;
  channel: string;
  eventKey: string;
  dispatches: TimelineDispatchDto[];
}

export interface EventTimelineDto {
  orderId: string;
  entries: TimelineEntryDto[];
  deduplicated: boolean;
}

export interface DiagnosticFindingDto {
  checkCode: string;
  provider?: string | null;
  severity: 'Info' | 'Low' | 'Medium' | 'High';
  passed: boolean;
  problem: string;
  reason: string;
  recommendedFix: string;
  hasFix: boolean;
}

export interface ProviderMonitoringDto {
  provider: string;
  uptimePercent: number;
  avgLatencyMs: number;
  successRatePercent: number;
  failureRatePercent: number;
  retryCount: number;
}

export interface MonitoringDto {
  providers: ProviderMonitoringDto[];
}

export interface LogsFilter {
  eventType?: string;
  provider?: string;
  status?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class AdsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private url(storeId: string): string {
    return `${this.base}/stores/${storeId}/ads`;
  }

  getDashboard(storeId: string): Observable<AdsDashboardDto> {
    return this.http.get<AdsDashboardDto>(`${this.url(storeId)}/dashboard`);
  }

  getProviders(storeId: string): Observable<ProviderIntegrationDto[]> {
    return this.http.get<ProviderIntegrationDto[]>(`${this.url(storeId)}/providers`);
  }

  connectProvider(storeId: string, provider: string, request: ConnectProviderRequest): Observable<ProviderIntegrationDto> {
    return this.http.post<ProviderIntegrationDto>(`${this.url(storeId)}/providers/${provider}`, request);
  }

  verifyProvider(storeId: string, provider: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/providers/${provider}/verify`, {});
  }

  disconnectProvider(storeId: string, provider: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/providers/${provider}/disconnect`, {});
  }

  sendTestEvent(storeId: string, eventType: string): Observable<TrackingLogRowDto[]> {
    return this.http.post<TrackingLogRowDto[]>(`${this.url(storeId)}/test/${eventType}`, {});
  }

  getLogs(storeId: string, filter: LogsFilter): Observable<PagedTrackingLogsDto> {
    let params = new HttpParams();
    if (filter.eventType) params = params.set('eventType', filter.eventType);
    if (filter.provider) params = params.set('provider', filter.provider);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    params = params.set('pageNumber', filter.pageNumber ?? 1);
    params = params.set('pageSize', filter.pageSize ?? 25);

    return this.http.get<PagedTrackingLogsDto>(`${this.url(storeId)}/logs`, { params });
  }

  getEventTimeline(storeId: string, orderId: string): Observable<EventTimelineDto> {
    return this.http.get<EventTimelineDto>(`${this.url(storeId)}/events/${orderId}/timeline`);
  }

  getDiagnostics(storeId: string): Observable<DiagnosticFindingDto[]> {
    return this.http.get<DiagnosticFindingDto[]>(`${this.url(storeId)}/diagnostics`);
  }

  getMonitoring(storeId: string): Observable<MonitoringDto> {
    return this.http.get<MonitoringDto>(`${this.url(storeId)}/monitoring`);
  }

  replayEvent(storeId: string, trackingEventId: string, dispatchLogId: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/replay/${trackingEventId}/${dispatchLogId}`, {});
  }
}
