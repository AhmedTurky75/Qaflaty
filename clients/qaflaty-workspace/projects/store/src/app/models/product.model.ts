export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  inStock: boolean;
  images: ProductImage[];
  // Detail-only optional fields
  hasVariants?: boolean;
  variantOptions?: VariantOption[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  attributes: Record<string, string>;
  sku: string;
  priceOverride?: { amount: number; currency: string };
  quantity: number;
  inStock: boolean;
  allowBackorder?: boolean;
}

export interface VariantOption {
  name: string;
  values: string[];
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
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
