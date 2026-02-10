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
