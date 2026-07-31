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
    path: ':id/related',
    loadComponent: () => import('./related-products/related-products.component').then(m => m.RelatedProductsComponent)
  },
  {
    path: ':id/cross-sell',
    loadComponent: () => import('./cross-sell/cross-sell.component').then(m => m.CrossSellComponent)
  },
  {
    path: ':id/upsell',
    loadComponent: () => import('./upsell/upsell.component').then(m => m.UpSellComponent)
  },
  {
    path: ':id/downsell',
    loadComponent: () => import('./downsell/downsell.component').then(m => m.DownsellComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./product-form/product-form.component').then(m => m.ProductFormComponent)
  }
];
