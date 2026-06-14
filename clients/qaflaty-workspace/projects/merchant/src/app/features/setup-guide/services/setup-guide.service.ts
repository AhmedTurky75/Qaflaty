import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StoreContextService } from '../../../core/services/store-context.service';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { BuilderService } from '../../store-builder/services/builder.service';
import { SetupTask } from '../models/setup-task.model';
import { StoreDto, StoreConfigurationDto, DeliveryZoneDto, FaqItemDto } from 'shared';
import { DashboardStats } from '../../dashboard/services/dashboard.service';

const DEFAULT_BRAND_COLOR = '#3B82F6';

@Injectable({ providedIn: 'root' })
export class SetupGuideService {
  private storeContext = inject(StoreContextService);
  private dashboardService = inject(DashboardService);
  private builderService = inject(BuilderService);

  loadTasks(storeId: string): Observable<SetupTask[]> {
    const store = this.storeContext.currentStore();
    if (!store) return of([]);

    return forkJoin({
      config: this.builderService.getConfiguration(storeId).pipe(
        catchError(() => of(null as StoreConfigurationDto | null))
      ),
      zones: this.builderService.getDeliveryZones(storeId).pipe(
        catchError(() => of([] as DeliveryZoneDto[]))
      ),
      faqs: this.builderService.getFaqItems(storeId).pipe(
        catchError(() => of([] as FaqItemDto[]))
      ),
      stats: this.dashboardService.getDashboardStats(storeId).pipe(
        catchError(() => of(null as DashboardStats | null))
      ),
    }).pipe(
      map(({ config, zones, faqs, stats }) =>
        this.buildTasks(store, config, zones, faqs, stats, storeId)
      )
    );
  }

  private buildTasks(
    store: StoreDto,
    config: StoreConfigurationDto | null,
    zones: DeliveryZoneDto[],
    faqs: FaqItemDto[],
    stats: DashboardStats | null,
    storeId: string
  ): SetupTask[] {
    const hasSocialLinks = config
      ? Object.values(config.socialLinks).some(v => !!v)
      : false;
    const hasPaymentConfig = (config?.paymentMethodAdjustments ?? []).some(a => a.isEnabled);
    const colorsCustomized =
      store.branding.primaryColor !== DEFAULT_BRAND_COLOR ||
      !!store.branding.secondaryColor;

    return [
      // ── Phase 1: Store Identity ──────────────────────────────────────────
      {
        id: 'store-created',
        phase: 1,
        phaseName: 'Store Identity',
        title: 'Create Your Store',
        description: 'Your online store is live and ready to configure',
        route: '/stores/create',
        priority: 'required',
        weight: 10,
        icon: '🏪',
        isComplete: true,
      },
      {
        id: 'logo-uploaded',
        phase: 1,
        phaseName: 'Store Identity',
        title: 'Upload Your Logo',
        description: 'Add a logo to build instant brand recognition',
        route: `/stores/${storeId}`,
        priority: 'required',
        weight: 7,
        icon: '🖼️',
        isComplete: !!store.branding.logoUrl,
      },
      {
        id: 'description-added',
        phase: 1,
        phaseName: 'Store Identity',
        title: 'Describe Your Store',
        description: 'Tell customers what you sell in a few words',
        route: `/stores/${storeId}`,
        priority: 'optional',
        weight: 6,
        icon: '✍️',
        isComplete: !!(store.description?.trim()),
      },
      {
        id: 'colors-set',
        phase: 1,
        phaseName: 'Store Identity',
        title: 'Choose Your Brand Colors',
        description: 'Pick colors that represent your brand identity',
        route: `/stores/${storeId}`,
        priority: 'optional',
        weight: 7,
        icon: '🎨',
        isComplete: colorsCustomized,
      },

      // ── Phase 2: Products & Catalog ──────────────────────────────────────
      {
        id: 'first-product',
        phase: 2,
        phaseName: 'Products & Catalog',
        title: 'Add Your First Product',
        description: 'Start building your product catalog',
        route: '/products',
        priority: 'required',
        weight: 20,
        icon: '📦',
        isComplete: (stats?.totalProducts ?? 0) > 0,
      },
      {
        id: 'delivery-fee',
        phase: 2,
        phaseName: 'Products & Catalog',
        title: 'Set Delivery Fee',
        description: 'Define how much you charge for shipping',
        route: `/stores/${storeId}`,
        priority: 'optional',
        weight: 5,
        icon: '🚚',
        isComplete:
          store.deliverySettings.deliveryFee.amount > 0 ||
          !!store.deliverySettings.freeDeliveryThreshold,
      },
      {
        id: 'product-search',
        phase: 2,
        phaseName: 'Products & Catalog',
        title: 'Enable Product Search',
        description: 'Help customers find what they want instantly',
        route: '/store-builder/search',
        priority: 'optional',
        weight: 5,
        icon: '🔍',
        isComplete: config?.searchSettings.enableTextSearch ?? false,
      },

      // ── Phase 3: Payments & Business ─────────────────────────────────────
      {
        id: 'payment-methods',
        phase: 3,
        phaseName: 'Payments & Business',
        title: 'Configure Payment Methods',
        description: 'Choose how customers can pay you',
        route: '/store-builder/payment-methods',
        priority: 'required',
        weight: 15,
        icon: '💳',
        isComplete: hasPaymentConfig,
      },
      {
        id: 'delivery-zones',
        phase: 3,
        phaseName: 'Payments & Business',
        title: 'Add Delivery Zones',
        description: 'Specify which areas you deliver to',
        route: '/store-builder/delivery-zones',
        priority: 'required',
        weight: 10,
        icon: '🗺️',
        isComplete: zones.length > 0,
      },

      // ── Phase 4: Growth & Branding ───────────────────────────────────────
      {
        id: 'social-links',
        phase: 4,
        phaseName: 'Growth & Branding',
        title: 'Add Social Media Links',
        description: 'Connect your social profiles to your store',
        route: '/store-builder/social-links',
        priority: 'optional',
        weight: 5,
        icon: '📱',
        isComplete: hasSocialLinks,
      },
      {
        id: 'faq-section',
        phase: 4,
        phaseName: 'Growth & Branding',
        title: 'Create FAQ Section',
        description: 'Answer common customer questions upfront',
        route: '/store-builder/faq',
        priority: 'optional',
        weight: 3,
        icon: '❓',
        isComplete: faqs.length > 0,
      },
      {
        id: 'whatsapp',
        phase: 4,
        phaseName: 'Growth & Branding',
        title: 'Enable WhatsApp Support',
        description: 'Let customers reach you on WhatsApp instantly',
        route: '/store-builder/communication',
        priority: 'optional',
        weight: 3,
        icon: '💬',
        isComplete: config?.communicationSettings.whatsAppEnabled ?? false,
      },
      {
        id: 'live-chat',
        phase: 4,
        phaseName: 'Growth & Branding',
        title: 'Enable Live Chat',
        description: 'Chat with customers in real time on your store',
        route: '/store-builder/communication',
        priority: 'optional',
        weight: 4,
        icon: '🗨️',
        isComplete: config?.communicationSettings.liveChatEnabled ?? false,
      },
    ];
  }
}
