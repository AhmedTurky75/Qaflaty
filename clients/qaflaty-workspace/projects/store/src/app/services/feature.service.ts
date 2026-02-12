import { Injectable, inject, computed } from '@angular/core';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private configService = inject(ConfigService);

  private config = this.configService.config;

  // Feature toggles
  isWishlistEnabled = computed(() => this.config()?.featureToggles?.wishlist ?? false);
  isReviewsEnabled = computed(() => this.config()?.featureToggles?.reviews ?? false);
  isPromoCodesEnabled = computed(() => this.config()?.featureToggles?.promoCodes ?? false);
  isNewsletterEnabled = computed(() => this.config()?.featureToggles?.newsletter ?? false);
  isProductSearchEnabled = computed(() => this.config()?.featureToggles?.productSearch ?? true);
  isSocialLinksEnabled = computed(() => this.config()?.featureToggles?.socialLinks ?? false);
  isAnalyticsEnabled = computed(() => this.config()?.featureToggles?.analytics ?? false);

  // Page toggles
  isAboutPageEnabled = computed(() => this.config()?.pageToggles?.aboutPage ?? false);
  isContactPageEnabled = computed(() => this.config()?.pageToggles?.contactPage ?? false);
  isFaqPageEnabled = computed(() => this.config()?.pageToggles?.faqPage ?? false);
  isTermsPageEnabled = computed(() => this.config()?.pageToggles?.termsPage ?? false);
  isPrivacyPageEnabled = computed(() => this.config()?.pageToggles?.privacyPage ?? false);
  isShippingReturnsPageEnabled = computed(() => this.config()?.pageToggles?.shippingReturnsPage ?? false);
  isCartPageEnabled = computed(() => this.config()?.pageToggles?.cartPage ?? true);

  // Auth
  authMode = computed(() => this.config()?.customerAuthSettings?.mode ?? 'GuestOnly');
  allowGuestCheckout = computed(() => this.config()?.customerAuthSettings?.allowGuestCheckout ?? true);

  // Communication
  isWhatsAppEnabled = computed(() => this.config()?.communicationSettings?.whatsAppEnabled ?? false);
  whatsAppNumber = computed(() => this.config()?.communicationSettings?.whatsAppNumber ?? '');
  isLiveChatEnabled = computed(() => this.config()?.communicationSettings?.liveChatEnabled ?? false);

  // Layout variants
  headerVariant = computed(() => this.config()?.headerVariant ?? 'header-minimal');
  footerVariant = computed(() => this.config()?.footerVariant ?? 'footer-standard');
  productCardVariant = computed(() => this.config()?.productCardVariant ?? 'card-standard');
  productGridVariant = computed(() => this.config()?.productGridVariant ?? 'grid-standard');

  // Social Links
  socialLinks = computed(() => this.config()?.socialLinks);

  isPageEnabled(pageType: string): boolean {
    const config = this.config();
    if (!config) return false;
    switch (pageType) {
      case 'About': return config.pageToggles.aboutPage;
      case 'Contact': return config.pageToggles.contactPage;
      case 'FAQ': return config.pageToggles.faqPage;
      case 'Terms': return config.pageToggles.termsPage;
      case 'Privacy': return config.pageToggles.privacyPage;
      case 'ShippingReturns': return config.pageToggles.shippingReturnsPage;
      case 'Cart': return config.pageToggles.cartPage;
      default: return true;
    }
  }
}
