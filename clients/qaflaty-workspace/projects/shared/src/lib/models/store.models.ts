export interface StoreDto {
  id: string;
  merchantId: string;
  slug: string;
  customDomain?: string;
  name: string;
  description?: string;
  branding: StoreBranding;
  status: StoreStatus;
  isMaintenanceMode: boolean;
  deliverySettings: DeliverySettings;
  createdAt: string;
  updatedAt: string;
  /** ISO 4217 code of the store's single currency (set once at creation, then locked). */
  currency: string;
  /** Display symbol for the store currency, e.g. "ج.م". */
  currencySymbol: string;
}

/** One ISO 4217 currency option, served by GET /api/currencies for the store-creation picker. */
export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  decimalDigits: number;
}

export interface StoreBranding {
  logoUrl?: string;
  secondaryLogoUrl?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
  ogImageUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
}

export interface DeliverySettings {
  deliveryFee: Money;
  freeDeliveryThreshold?: Money;
}

export interface Money {
  amount: number;
  /** ISO 4217 code. Always the owning store's single currency. */
  currency: string;
}

/** @deprecated Currency is now a store-level ISO 4217 string code; kept for backward compatibility. */
export enum Currency {
  SAR = 'SAR',
  USD = 'USD'
}

export enum StoreStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  Maintenance = 'Maintenance'
}

export interface CreateStoreRequest {
  slug: string;
  name: string;
  description?: string;
  /** ISO 4217 currency code chosen at creation; locked afterward. Defaults to EGP. */
  currency?: string;
}

export interface UpdateStoreRequest {
  name: string;
  description?: string;
}

export interface UpdateBrandingRequest {
  logoUrl?: string;
  secondaryLogoUrl?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
  ogImageUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
}

export interface UpdateDeliverySettingsRequest {
  deliveryFee: Money;
  freeDeliveryThreshold?: Money;
}
