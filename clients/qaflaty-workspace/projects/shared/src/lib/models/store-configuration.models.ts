export interface BilingualText {
  arabic: string;
  english: string;
}

export interface PageToggles {
  aboutPage: boolean;
  contactPage: boolean;
  faqPage: boolean;
  termsPage: boolean;
  privacyPage: boolean;
  shippingReturnsPage: boolean;
  cartPage: boolean;
}

export interface FeatureToggles {
  wishlist: boolean;
  reviews: boolean;
  promoCodes: boolean;
  newsletter: boolean;
  productSearch: boolean;
  socialLinks: boolean;
  analytics: boolean;
}

export interface CustomerAuthSettings {
  mode: 'GuestOnly' | 'Required' | 'Optional';
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
}

export interface CommunicationSettings {
  whatsAppEnabled: boolean;
  whatsAppNumber?: string;
  whatsAppDefaultMessage?: string;
  liveChatEnabled: boolean;
  aiChatbotEnabled: boolean;
  aiChatbotName?: string;
}

export interface LocalizationSettings {
  defaultLanguage: string;
  enableBilingual: boolean;
  defaultDirection: string;
}

export interface SocialLinksConfig {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tikTok?: string;
  snapchat?: string;
  youTube?: string;
}

export interface PageSeoSettings {
  metaTitle: BilingualText;
  metaDescription: BilingualText;
  ogImageUrl?: string;
  noIndex: boolean;
  noFollow: boolean;
}

export interface SectionConfigurationDto {
  id: string;
  sectionType: string;
  variantId: string;
  isEnabled: boolean;
  sortOrder: number;
  contentJson?: string;
  settingsJson?: string;
}

export interface PageConfigurationDto {
  id: string;
  storeId: string;
  pageType: string;
  slug: string;
  title: BilingualText;
  isEnabled: boolean;
  seoSettings: PageSeoSettings;
  contentJson?: string;
  sections: SectionConfigurationDto[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreConfigurationDto {
  id: string;
  storeId: string;
  pageToggles: PageToggles;
  featureToggles: FeatureToggles;
  customerAuthSettings: CustomerAuthSettings;
  communicationSettings: CommunicationSettings;
  localizationSettings: LocalizationSettings;
  socialLinks: SocialLinksConfig;
  headerVariant: string;
  footerVariant: string;
  productCardVariant: string;
  productGridVariant: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorefrontConfigDto {
  storeId: string;
  slug: string;
  name: string;
  description?: string;
  branding: { logoUrl?: string; primaryColor: string };
  deliverySettings: { deliveryFee: { amount: number; currency: string }; freeDeliveryThreshold?: { amount: number; currency: string } };
  pageToggles: PageToggles;
  featureToggles: FeatureToggles;
  customerAuthSettings: CustomerAuthSettings;
  communicationSettings: CommunicationSettings;
  localizationSettings: LocalizationSettings;
  socialLinks: SocialLinksConfig;
  headerVariant: string;
  footerVariant: string;
  productCardVariant: string;
  productGridVariant: string;
}

export interface FaqItemDto {
  id: string;
  storeId: string;
  question: BilingualText;
  answer: BilingualText;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface UpdateStoreConfigurationRequest {
  pageToggles: PageToggles;
  featureToggles: FeatureToggles;
  customerAuthSettings: CustomerAuthSettings;
  communicationSettings: CommunicationSettings;
  localizationSettings: LocalizationSettings;
  socialLinks: SocialLinksConfig;
  headerVariant: string;
  footerVariant: string;
  productCardVariant: string;
  productGridVariant: string;
}

export interface UpdatePageConfigurationRequest {
  title: BilingualText;
  slug: string;
  isEnabled: boolean;
  seoSettings: PageSeoSettings;
  contentJson?: string;
}

export interface CreateCustomPageRequest {
  title: BilingualText;
  slug: string;
  contentJson?: string;
}

export interface UpdateSectionsRequest {
  sections: SectionConfigurationDto[];
}

export interface CreateFaqItemRequest {
  question: BilingualText;
  answer: BilingualText;
  isPublished: boolean;
}

export interface UpdateFaqItemRequest {
  question: BilingualText;
  answer: BilingualText;
  isPublished: boolean;
}
