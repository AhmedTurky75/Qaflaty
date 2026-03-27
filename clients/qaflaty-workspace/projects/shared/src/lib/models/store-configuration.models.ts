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
  requireOtpOnPlaceOrder: boolean;
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

export interface PaymentMethodAdjustment {
  id: string;
  paymentMethod: 'COD' | 'Visa' | 'Mastercard' | 'Mada' | 'ApplePay' | 'STCPay' | 'BankTransfer' | 'Other';
  adjustmentType: 'Fixed' | 'Percentage';
  value: number;
  displayLabel?: string;
}

export interface SearchSettings {
  enableTextSearch: boolean;
  enableCategoryFilter: boolean;
  enablePriceFilter: boolean;
  enablePropertyFilters: boolean;
  filterablePropertyDefinitionIds: string[];
  allowedSortOptions: string[];
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
  searchSettings: SearchSettings;
  paymentMethodAdjustments: PaymentMethodAdjustment[];
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
  isUnderMaintenance: boolean;
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

export interface SetPaymentMethodAdjustmentsRequest {
  adjustments: Array<{
    paymentMethod: string;
    adjustmentType: string;
    value: number;
    displayLabel?: string;
  }>;
}

export interface UpdateSearchSettingsRequest {
  enableTextSearch: boolean;
  enableCategoryFilter: boolean;
  enablePriceFilter: boolean;
  enablePropertyFilters: boolean;
  filterablePropertyDefinitionIds: string[];
  allowedSortOptions: string[];
}

// Delivery Zones
export interface DeliveryZoneDto {
  id: string;
  storeId: string;
  level: 'Country' | 'City' | 'District';
  referenceId: number;
  isDeliveryEnabled: boolean;
  customDeliveryFee?: number;
  feeCurrency?: string;
}

export interface UpsertDeliveryZoneRequest {
  level: 'Country' | 'City' | 'District';
  referenceId: number;
  isDeliveryEnabled: boolean;
  customDeliveryFee?: number;
  feeCurrency?: string;
}

// Product Properties
export interface ProductPropertyDefinitionDto {
  id: string;
  storeId: string;
  name: string;
  displayName: string;
  type: 'Text' | 'Number' | 'SingleChoice' | 'MultiChoice' | 'Boolean';
  options: string[];
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export interface ProductPropertyValueDto {
  id: string;
  definitionId: string;
  definitionName: string;
  value: string;
}

export interface CreateProductPropertyDefinitionRequest {
  name: string;
  displayName: string;
  type: string;
  options: string[];
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export interface UpdateProductPropertyDefinitionRequest {
  displayName: string;
  type: string;
  options: string[];
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export interface SetProductPropertyValuesRequest {
  values: Array<{ definitionId: string; value: string }>;
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
