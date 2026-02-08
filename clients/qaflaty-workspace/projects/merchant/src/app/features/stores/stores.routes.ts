import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./store-list/store-list.component').then(m => m.StoreListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./create-store/create-store.component').then(m => m.CreateStoreComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./store-details/store-details.component').then(m => m.StoreDetailsComponent)
  }
];
