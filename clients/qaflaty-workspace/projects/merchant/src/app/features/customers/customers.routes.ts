import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./customer-list/customer-list.component').then(m => m.CustomerListComponent)
  }
];
