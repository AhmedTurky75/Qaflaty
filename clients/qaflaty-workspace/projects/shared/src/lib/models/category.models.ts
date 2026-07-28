export interface CategoryDto {
  id: string;
  storeId: string;
  parentId?: string;
  name: string;
  nameAr?: string;
  slug: string;
  /** Display rank among siblings — lower sorts first. */
  sortOrder: number;
  productCount?: number;
  /** Uploaded category image; takes precedence over `iconName` when both are set. */
  imageUrl?: string | null;
  /** Built-in glyph key (see CATEGORY_ICONS) used when there is no image. */
  iconName?: string | null;
  /** HTML shown above the products on the storefront category page (English). */
  contentHtml?: string | null;
  /** HTML shown above the products on the storefront category page (Arabic). */
  contentHtmlAr?: string | null;
  createdAt: string;
}

export interface CategoryTreeDto extends CategoryDto {
  children: CategoryTreeDto[];
}

export interface CreateCategoryRequest {
  name: string;
  nameAr?: string;
  slug: string;
  parentId?: string;
  sortOrder?: number;
  imageUrl?: string | null;
  iconName?: string | null;
  contentHtml?: string | null;
  contentHtmlAr?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  nameAr?: string;
  parentId?: string | null;
  /** Omit to leave the current rank untouched (the reorder endpoint owns ordering). */
  sortOrder?: number;
  imageUrl?: string | null;
  iconName?: string | null;
  contentHtml?: string | null;
  contentHtmlAr?: string | null;
}
