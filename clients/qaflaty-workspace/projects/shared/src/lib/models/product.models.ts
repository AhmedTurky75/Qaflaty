import { Money } from './store.models';

export interface ProductListDto {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
  firstImageUrl?: string;
}

export interface ProductDto {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  sku?: string;
  trackInventory?: boolean;
  status: string;
  categoryId?: string;
  images?: ProductImage[];
  firstImageUrl?: string;
  createdAt?: string;
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
  slug: string;
  description?: string;
  price: Money;
  compareAtPrice?: Money;
  quantity: number;
  sku?: string;
  trackInventory: boolean;
  categoryId?: string;
  status?: string;
}

// Variant DTOs
export interface VariantOptionDto {
  name: string;        // e.g., "Color", "Size"
  values: string[];    // e.g., ["Red", "Blue", "Green"]
}

export interface ProductVariantDto {
  id: string;
  productId: string;
  attributes: Record<string, string>;  // e.g., {"Color": "Red", "Size": "M"}
  sku: string;
  priceOverride?: number;
  priceOverrideCurrency?: string;
  quantity: number;
  allowBackorder: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductWithVariantsDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  hasVariants: boolean;
  variantOptions: VariantOptionDto[];
  variants: ProductVariantDto[];
}

export interface AddVariantOptionRequest {
  name: string;
  values: string[];
}

export interface AddProductVariantRequest {
  attributes: Record<string, string>;
  sku: string;
  priceOverride?: Money;
  quantity: number;
  allowBackorder: boolean;
}

export interface UpdateProductVariantRequest {
  sku: string;
  priceOverride?: Money;
  quantity: number;
  allowBackorder: boolean;
}

export interface AdjustInventoryRequest {
  quantityChange: number;
  movementType: InventoryMovementType;
  reason?: string;
}

export enum InventoryMovementType {
  Adjustment = 'Adjustment',
  Sale = 'Sale',
  Return = 'Return',
  Restock = 'Restock',
  Damaged = 'Damaged'
}

export interface InventoryMovementDto {
  id: string;
  productId: string;
  variantId?: string;
  movementType: string;
  quantity: number;
  reason?: string;
  createdAt: string;
}
