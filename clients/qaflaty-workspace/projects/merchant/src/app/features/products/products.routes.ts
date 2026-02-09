import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./product-form/product-form.component').then(m => m.ProductFormComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./category-management/category-management.component').then(m => m.CategoryManagementComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./product-form/product-form.component').then(m => m.ProductFormComponent)
  }
];
