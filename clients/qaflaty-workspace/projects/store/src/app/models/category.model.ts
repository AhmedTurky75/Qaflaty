export interface Category {
  id: string;
  storeId: string;
  parentId?: string;
  name: string;
  nameAr?: string;
  slug: string;
  /** Display rank set by the merchant — the API already returns categories in this order. */
  sortOrder: number;
  productCount?: number;
  /** Uploaded category image; falls back to `iconName` when absent. */
  imageUrl?: string | null;
  /** Built-in glyph key rendered when there is no image. */
  iconName?: string | null;
  /** Merchant-authored HTML shown above this category's products. */
  contentHtml?: string | null;
  contentHtmlAr?: string | null;
  createdAt: string;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}
