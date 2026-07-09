import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export type StandardEventType =
  | 'PageView' | 'ViewContent' | 'Search' | 'AddToCart' | 'InitiateCheckout'
  | 'AddPaymentInfo' | 'Purchase' | 'CompleteRegistration' | 'Contact';

export interface TrackingContentItem {
  contentId: string;
  quantity: number;
  price?: number;
}

export interface TrackOptions {
  /** Pass an explicit key (e.g. the order id for Purchase) so the browser and server events dedupe at the provider. Auto-generated otherwise. */
  eventKey?: string;
  value?: number;
  currency?: string;
  contents?: TrackingContentItem[];
  orderId?: string;
  customerRef?: string;
  customerEmail?: string;
  customerPhone?: string;
  pageUrl?: string;
}

interface TrackingPixelConfigDto {
  provider: string;
  publicConfig: Record<string, string>;
}

/**
 * Loads each enabled provider's browser script automatically and fires standard events on
 * both the browser pixel and the server mirror (same event key for provider-side dedup).
 * Tracking never blocks page rendering — script loading and the server call are both
 * fire-and-forget.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private http = inject(HttpClient);
  private document = inject(DOCUMENT);
  private renderer: Renderer2;
  private initialized = false;
  private metaLoaded = false;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.http.get<TrackingPixelConfigDto[]>(`${environment.apiUrl}/storefront/tracking/config`).subscribe({
      next: (pixels) => this.loadScripts(pixels),
      error: () => {
        // Tracking is best-effort — a failed config load must never block the storefront.
      }
    });
  }

  track(eventType: StandardEventType, options: TrackOptions = {}): string {
    const eventKey = options.eventKey || this.generateEventKey();

    this.fireBrowserPixels(eventType, eventKey, options);

    this.http.post(`${environment.apiUrl}/storefront/tracking/events`, {
      eventKey,
      eventType,
      value: options.value,
      currency: options.currency,
      contents: options.contents,
      orderId: options.orderId,
      customerRef: options.customerRef,
      pageUrl: options.pageUrl ?? this.document.location.href,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone
    }).subscribe({ next: () => {}, error: () => {} });

    return eventKey;
  }

  private fireBrowserPixels(eventType: StandardEventType, eventKey: string, options: TrackOptions): void {
    const win = window as unknown as { fbq?: (...args: unknown[]) => void };
    if (win.fbq) {
      win.fbq('track', eventType, {
        value: options.value,
        currency: options.currency,
        content_ids: options.contents?.map(c => c.contentId),
        contents: options.contents?.map(c => ({ id: c.contentId, quantity: c.quantity }))
      }, { eventID: eventKey });
    }
  }

  private loadScripts(pixels: TrackingPixelConfigDto[]): void {
    for (const pixel of pixels) {
      if (pixel.provider === 'Meta' && pixel.publicConfig['pixelId']) {
        this.loadMetaPixel(pixel.publicConfig['pixelId']);
      }
      // Other providers (TikTok, Snapchat, GA4, Google Ads, GTM) are scaffolded server-side
      // but not yet wired for browser script injection — see docs/ADS_MANAGEMENT.md, §18.
    }
  }

  private loadMetaPixel(pixelId: string): void {
    if (this.metaLoaded) return;
    this.metaLoaded = true;

    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
    `;
    this.renderer.appendChild(this.document.head, script);
  }

  private generateEventKey(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
