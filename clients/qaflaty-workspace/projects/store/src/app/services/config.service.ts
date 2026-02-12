import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorefrontConfigDto, PageConfigurationDto, FaqItemDto } from 'shared';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  config = signal<StorefrontConfigDto | null>(null);
  pages = signal<PageConfigurationDto[]>([]);
  isLoaded = signal(false);

  loadConfig(): Observable<StorefrontConfigDto> {
    return this.http.get<StorefrontConfigDto>(`${environment.apiUrl}/storefront/config`).pipe(
      tap(config => {
        this.config.set(config);
        this.isLoaded.set(true);
      })
    );
  }

  loadPages(storeId: string): Observable<PageConfigurationDto[]> {
    return this.http.get<PageConfigurationDto[]>(`${environment.apiUrl}/storefront/pages`).pipe(
      tap(pages => this.pages.set(pages))
    );
  }

  getPageBySlug(slug: string): Observable<PageConfigurationDto> {
    return this.http.get<PageConfigurationDto>(`${environment.apiUrl}/storefront/pages/${slug}`);
  }

  getFaqItems(): Observable<FaqItemDto[]> {
    return this.http.get<FaqItemDto[]>(`${environment.apiUrl}/storefront/faq`);
  }
}
