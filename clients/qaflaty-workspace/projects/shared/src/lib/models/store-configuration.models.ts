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

export type AssistantPersonality = 'Friendly' | 'Professional' | 'SalesFocused' | 'Technical';
export type AssistantLanguage = 'Arabic' | 'English' | 'AutoDetect';

export interface AiAssistantSettings {
  enabled: boolean;
  disableHumanChat: boolean;
  assistantName?: string;
  welcomeMessage?: string;
  personality: AssistantPersonality;
  language: AssistantLanguage;
  enabledHoursStart?: number | null;
  enabledHoursEnd?: number | null;
  maxConversationLength: number;
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

/**
 * Layout / style settings for a single section. Serialized into
 * `SectionConfigurationDto.settingsJson`. Single source of truth shared by the
 * merchant editor (writes) and the storefront wrapper (reads). No DB migration
 * needed — this is stored inside the existing `SettingsJson` JSONB string.
 */
export interface SectionSettings {
  /** Section-type specific settings live here too (e.g. pageSize) — kept loose. */
  [key: string]: unknown;
  backgroundColor?: string;      // hex / css var
  backgroundImageUrl?: string;
  textColor?: string;            // hex / css var
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingX?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'full' | 'wide' | 'narrow';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | '2xl';
  visibility?: 'all' | 'desktop' | 'mobile'; // device-specific visibility
  anchorId?: string;             // for in-page CTA links
  animation?: 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom'; // scroll-in animation
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

/** An A/B test variant of a page (the page's own sections are the control). */
export interface PageVariantDto {
  id: string;              // empty string for a not-yet-persisted variant
  name: string;
  weight: number;
  isActive: boolean;
  sectionsJson?: string;   // serialized SectionConfigurationDto[] for this variant
  impressions: number;
  conversions: number;
}

/** Storefront experiment payload used to resolve a sticky variant client-side. */
export interface PageExperimentDto {
  pageId: string;
  controlWeight: number;
  variants: PageVariantDto[];
}

export interface UpdatePageVariantsRequest {
  variants: PageVariantDto[];
}

export interface PaymentMethodAdjustment {
  id: string;
  paymentMethod: string;
  adjustmentType: string;
  value: number;
  displayLabel?: string;
  isEnabled: boolean;
  defaultLabel: string;
  defaultDescription: string;
}

export interface PaymentMethodOptionDto {
  key: string;
  defaultLabel: string;
  defaultDescription: string;
}

export interface SearchSettings {
  enableTextSearch: boolean;
  enableCategoryFilter: boolean;
  enablePriceFilter: boolean;
  enablePropertyFilters: boolean;
  filterablePropertyDefinitionIds: string[];
  allowedSortOptions: string[];
}

export interface TaxSettings {
  enabled: boolean;
  rate: number;
  pricesIncludeTax: boolean;
  label: string;
}

export interface StoreConfigurationDto {
  id: string;
  storeId: string;
  pageToggles: PageToggles;
  featureToggles: FeatureToggles;
  customerAuthSettings: CustomerAuthSettings;
  communicationSettings: CommunicationSettings;
  aiAssistantSettings: AiAssistantSettings;
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
  taxSettings?: TaxSettings;
}

export interface FilterablePropertyDefinition {
  id: string;
  name: string;
  displayName: string;
  type: 'Text' | 'Number' | 'SingleChoice' | 'MultiChoice' | 'Boolean';
  options: string[];
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
  aiAssistantSettings: AiAssistantSettings;
  localizationSettings: LocalizationSettings;
  socialLinks: SocialLinksConfig;
  headerVariant: string;
  footerVariant: string;
  productCardVariant: string;
  productGridVariant: string;
  isUnderMaintenance: boolean;
  searchSettings: SearchSettings;
  paymentMethodAdjustments: PaymentMethodAdjustment[];
  filterablePropertyDefinitions: FilterablePropertyDefinition[];
  taxSettings?: TaxSettings;
  /** ISO 4217 code of the store's single currency, e.g. "EGP". */
  currency: string;
  /** Display symbol for the store currency, e.g. "ج.م". */
  currencySymbol: string;
}

export interface AiAssistantStatusDto {
  enabled: boolean;
  disableHumanChat: boolean;
  serviceConfigured: boolean;
  hasKnowledge: boolean;
  productsEmbedded: number;
  faqItemsEmbedded: number;
  storePagesEmbedded: number;
  totalDocuments: number;
  lastRefreshedAtUtc?: string | null;
}

export interface AiKnowledgeRefreshResultDto {
  productsEmbedded: number;
  faqItemsEmbedded: number;
  storePagesEmbedded: number;
  totalDocuments: number;
  completedAtUtc: string;
}

export interface AiQuestionStatDto {
  question: string;
  count: number;
}

export interface AiProductInterestDto {
  productId: string;
  name: string;
  count: number;
}

export interface AiAnalyticsDto {
  conversationsLast30Days: number;
  conversationsToday: number;
  repliesTotal: number;
  productsRecommended: number;
  cartAdditions: number;
  ordersPlaced: number;
  knowledgeGaps: number;
  conversionRate: number;
  topQuestions: AiQuestionStatDto[];
  productInterest: AiProductInterestDto[];
  knowledgeGapQuestions: string[];
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
  aiAssistantSettings: AiAssistantSettings;
  localizationSettings: LocalizationSettings;
  socialLinks: SocialLinksConfig;
  headerVariant: string;
  footerVariant: string;
  productCardVariant: string;
  productGridVariant: string;
  taxSettings?: TaxSettings;
}

export interface SetPaymentMethodAdjustmentsRequest {
  adjustments: Array<{
    paymentMethod: string;
    adjustmentType: string;
    value: number;
    displayLabel?: string;
    isEnabled?: boolean;
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
