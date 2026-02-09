import { Money } from './store.model';

export interface Product {
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
  discountPercentage?: number;
  discountAmount?: Money;
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

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  sortBy?: ProductSortBy;
  page?: number;
  pageSize?: number;
}

export enum ProductSortBy {
  NameAsc = 'NameAsc',
  NameDesc = 'NameDesc',
  PriceLowHigh = 'PriceLowHigh',
  PriceHighLow = 'PriceHighLow',
  Newest = 'Newest'
}

export interface PaginatedProducts {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
