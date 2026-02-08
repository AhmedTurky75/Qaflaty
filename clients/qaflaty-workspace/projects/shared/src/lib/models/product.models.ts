import { Money } from './store.models';

export interface ProductDto {
  id: string;
  storeId: string;
  categoryId?: string;
  name: string;
  slug: string;
  description?: string;
  pricing: ProductPricing;
  inventory: ProductInventory;
  status: ProductStatus;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductPricing {
  price: Money;
  compareAtPrice?: Money;
  hasDiscount: boolean;
  discountPercentage: number;
  discountAmount: Money;
}

export interface ProductInventory {
  quantity: number;
  sku?: string;
  trackInventory: boolean;
  inStock: boolean;
  lowStock: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export enum ProductStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Draft = 'Draft'
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  categoryId?: string;
  price: Money;
  compareAtPrice?: Money;
  quantity: number;
  sku?: string;
  trackInventory: boolean;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  categoryId?: string;
}

export interface UpdateProductPricingRequest {
  price: Money;
  compareAtPrice?: Money;
}

export interface UpdateProductInventoryRequest {
  quantity: number;
  sku?: string;
  trackInventory: boolean;
}
