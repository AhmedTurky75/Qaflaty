export interface CategoryDto {
  id: string;
  storeId: string;
  parentId?: string;
  name: string;
  nameAr?: string;
  slug: string;
  sortOrder: number;
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
}

export interface UpdateCategoryRequest {
  name: string;
  nameAr?: string;
  parentId?: string | null;
}
