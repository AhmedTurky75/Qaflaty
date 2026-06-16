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
  authMode = computed(() => this.config()?.customerAuthSettings?.mode ?? 'Optional');
  allowGuestCheckout = computed(() => this.config()?.customerAuthSettings?.allowGuestCheckout ?? true);

  // Communication
  isWhatsAppEnabled = computed(() => this.config()?.communicationSettings?.whatsAppEnabled ?? false);
  whatsAppNumber = computed(() => this.config()?.communicationSettings?.whatsAppNumber ?? '');
  isLiveChatEnabled = computed(() => this.config()?.communicationSettings?.liveChatEnabled ?? false);

  // AI shopping assistant
  isAiAssistantEnabled = computed(() => this.config()?.aiAssistantSettings?.enabled ?? false);
  aiDisableHumanChat = computed(() => this.config()?.aiAssistantSettings?.disableHumanChat ?? false);
  aiAssistantName = computed(() => this.config()?.aiAssistantSettings?.assistantName ?? '');
  aiWelcomeMessage = computed(() => this.config()?.aiAssistantSettings?.welcomeMessage ?? '');
  // The chat widget should show when human live chat OR the AI assistant is enabled.
  isChatEnabled = computed(() => this.isLiveChatEnabled() || this.isAiAssistantEnabled());

  // Layout variants
  headerVariant = computed(() => {
    const legacyMap: Record<string, string> = {
      'Centered': 'header-centered',
      'LeftAligned': 'header-full',
      'MinimalCentered': 'header-minimal',
      'SplitNavigation': 'header-sidebar',
    };
    const raw = this.config()?.headerVariant;
    if (!raw) return 'header-minimal';
    return legacyMap[raw] ?? raw;
  });
  footerVariant = computed(() => {
    const legacyMap: Record<string, string> = {
      'FourColumn': 'footer-standard',
      'ThreeColumn': 'footer-centered',
      'Minimal': 'footer-minimal',
      'Stacked': 'footer-standard',
    };
    const raw = this.config()?.footerVariant;
    if (!raw) return 'footer-standard';
    return legacyMap[raw] ?? raw;
  });
  productCardVariant = computed(() => {
    const legacyMap: Record<string, string> = {
      'Standard': 'card-standard',
      'Compact':  'card-minimal',
      'Detailed': 'card-detailed',
      'WithHover': 'card-overlay',
    };
    const raw = this.config()?.productCardVariant;
    if (!raw) return 'card-standard';
    return legacyMap[raw] ?? raw;
  });
  productGridVariant = computed(() => {
    const legacyMap: Record<string, string> = {
      'TwoColumn': 'grid-2',
      'ThreeColumn': 'grid-3',
      'FourColumn': 'grid-4',
      'Masonry': 'grid-masonry',
      'grid-standard': 'grid-3',
    };
    const raw = this.config()?.productGridVariant;
    if (!raw) return 'grid-3';
    return legacyMap[raw] ?? raw;
  });

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
