export interface Category {
  id: string;
  storeId: string;
  parentId?: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}
