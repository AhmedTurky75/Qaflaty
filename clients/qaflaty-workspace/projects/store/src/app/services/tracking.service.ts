import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { GuestSessionService } from './guest-session.service';
import { CustomerAuthService } from './customer-auth.service';
import { PresenceService } from './presence.service';

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
// Our standard event names -> each provider's own vocabulary. Meta uses our names verbatim.
const TIKTOK_EVENT_NAMES: Record<StandardEventType, string> = {
  PageView: 'Pageview', ViewContent: 'ViewContent', Search: 'Search', AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout', AddPaymentInfo: 'AddPaymentInfo', Purchase: 'CompletePayment',
  CompleteRegistration: 'CompleteRegistration', Contact: 'Contact'
};

const SNAPCHAT_EVENT_NAMES: Record<StandardEventType, string> = {
  PageView: 'PAGE_VIEW', ViewContent: 'VIEW_CONTENT', Search: 'SEARCH', AddToCart: 'ADD_CART',
  InitiateCheckout: 'START_CHECKOUT', AddPaymentInfo: 'ADD_BILLING', Purchase: 'PURCHASE',
  CompleteRegistration: 'SIGN_UP', Contact: 'CONTACT'
};

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private http = inject(HttpClient);
  private document = inject(DOCUMENT);
  private guestSession = inject(GuestSessionService);
  private customerAuth = inject(CustomerAuthService);
  private presence = inject(PresenceService);
  private renderer: Renderer2;
  private initialized = false;
  private metaLoaded = false;
  private tiktokLoaded = false;
  private snapchatLoaded = false;

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
    // Every event needs at least one real matching parameter or Meta/TikTok reject it
    // ("insufficient customer information"). A stable per-visitor id (the logged-in customer,
    // or the guest session id everyone already gets) satisfies that for every event, not just
    // ones that happen to carry an email/phone.
    const customerRef = options.customerRef ?? this.resolveCustomerRef();

    // A product page finished loading — count this visitor against that product's live viewer
    // total on the merchant dashboard until they navigate away (see PresenceService).
    if (eventType === 'ViewContent' && options.contents?.[0]?.contentId) {
      this.presence.onViewProduct(options.contents[0].contentId);
    }

    this.fireBrowserPixels(eventType, eventKey, options);

    this.http.post(`${environment.apiUrl}/storefront/tracking/events`, {
      eventKey,
      eventType,
      value: options.value,
      currency: options.currency,
      contents: options.contents,
      orderId: options.orderId,
      customerRef,
      pageUrl: options.pageUrl ?? this.document.location.href,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone
    }).subscribe({ next: () => {}, error: () => {} });

    return eventKey;
  }

  private resolveCustomerRef(): string {
    const customer = this.customerAuth.customer();
    return customer ? customer.id : this.guestSession.getOrCreateGuestId();
  }

  private fireBrowserPixels(eventType: StandardEventType, eventKey: string, options: TrackOptions): void {
    const win = window as unknown as {
      fbq?: (...args: unknown[]) => void;
      ttq?: { track: (...args: unknown[]) => void };
      snaptr?: (...args: unknown[]) => void;
    };

    // Every provider gets the SAME eventKey as event id, so its own dedup merges the browser
    // hit with the server-side event we mirror through /storefront/tracking/events.
    if (win.fbq) {
      win.fbq('track', eventType, {
        value: options.value,
        currency: options.currency,
        content_ids: options.contents?.map(c => c.contentId),
        contents: options.contents?.map(c => ({ id: c.contentId, quantity: c.quantity }))
      }, { eventID: eventKey });
    }

    if (win.ttq) {
      win.ttq.track(TIKTOK_EVENT_NAMES[eventType], {
        value: options.value,
        currency: options.currency,
        contents: options.contents?.map(c => ({ content_id: c.contentId, quantity: c.quantity, price: c.price }))
      }, { event_id: eventKey });
    }

    if (win.snaptr) {
      win.snaptr('track', SNAPCHAT_EVENT_NAMES[eventType], {
        price: options.value,
        currency: options.currency,
        item_ids: options.contents?.map(c => c.contentId),
        client_dedup_id: eventKey
      });
    }
  }

  private loadScripts(pixels: TrackingPixelConfigDto[]): void {
    for (const pixel of pixels) {
      const id = pixel.publicConfig['pixelId'];
      if (!id) continue;

      if (pixel.provider === 'Meta') this.loadMetaPixel(id);
      else if (pixel.provider === 'TikTok') this.loadTikTokPixel(id);
      else if (pixel.provider === 'Snapchat') this.loadSnapchatPixel(id);
      // GA4, Google Ads, GTM are deferred to a later phase — see docs/ADS_MANAGEMENT.md, §18.
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

  private loadTikTokPixel(pixelCode: string): void {
    if (this.tiktokLoaded) return;
    this.tiktokLoaded = true;

    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
        ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
        for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
        ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
        ttq.load('${pixelCode}');
      }(window, document, 'ttq');
    `;
    this.renderer.appendChild(this.document.head, script);
  }

  private loadSnapchatPixel(pixelId: string): void {
    if (this.snapchatLoaded) return;
    this.snapchatLoaded = true;

    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?
      a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';
      var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];
      u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
      snaptr('init', '${pixelId}');
    `;
    this.renderer.appendChild(this.document.head, script);
  }

  private generateEventKey(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
