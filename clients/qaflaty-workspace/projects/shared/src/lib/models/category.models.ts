export interface CategoryDto {
  id: string;
  storeId: string;
  parentId?: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryTreeDto extends CategoryDto {
  children: CategoryTreeDto[];
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parentId?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  parentId?: string | null;
}
