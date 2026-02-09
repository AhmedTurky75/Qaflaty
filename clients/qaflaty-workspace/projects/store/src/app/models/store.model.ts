export interface Store {
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
  currency: string;
}

export enum StoreStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended'
}
