export interface StoreDto {
  id: string;
  merchantId: string;
  slug: string;
  customDomain?: string;
  name: string;
  description?: string;
  branding: StoreBranding;
  status: StoreStatus;
  deliverySettings: DeliverySettings;
  createdAt: string;
  updatedAt: string;
}

export interface StoreBranding {
  logoUrl?: string;
  primaryColor: string;
}

export interface DeliverySettings {
  deliveryFee: Money;
  freeDeliveryThreshold?: Money;
}

export interface Money {
  amount: number;
  currency: Currency;
}

export enum Currency {
  SAR = 'SAR',
  USD = 'USD'
}

export enum StoreStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended'
}

export interface CreateStoreRequest {
  slug: string;
  name: string;
  description?: string;
}

export interface UpdateStoreRequest {
  name: string;
  description?: string;
}

export interface UpdateBrandingRequest {
  logoUrl?: string;
  primaryColor: string;
}

export interface UpdateDeliverySettingsRequest {
  deliveryFee: Money;
  freeDeliveryThreshold?: Money;
}
